import http, { IncomingMessage, ServerResponse } from 'node:http';
import zlib from 'node:zlib';
import url, { type UrlWithParsedQuery } from 'node:url';

const port = 8080;

// In-memory storage of all match broadcast fragments, metadata, etc.
// Can easily hold many matches in-memory on modern computers, especially with compression
type BroadCastMatchPart = {
	signup_fragment: number;
	start: any;
	protocol: any;
	cdndelay: any;
	full: any;
	delta: any;
	timestamp: any;
	tps: any;
	endtick: any;
	tick: any;
	keyframe_interval: any;
	token_redirect: any;
	map: any;
};

const match_broadcasts = {} as Record<string, BroadCastMatchPart[]>;

// Example of how to support token_redirect (for CDN, unified playcast URL for the whole event, etc.)
let token_redirect_for_example = null as string | null;

const stats = {
	// Various stats that developers might want to track in their production environments
	post_field: 0,
	get_field: 0,
	get_start: 0,
	get_frag_meta: 0,
	sync: 0,
	not_found: 0,
	new_match_broadcasts: 0,
	err: [0, 0, 0, 0],
	requests: 0,
	started: Date.now(),
	version: 1
};

function respondSimpleError(uri: string | undefined, response: ServerResponse, code: number, explanation: string) {
	// if( uri ) console.log( uri + " => " + code + " " + explanation );
	response.writeHead(code, { 'X-Reason': explanation });
	response.end();
}

function checkFragmentCdnDelayElapsed(fragmentRec: BroadCastMatchPart, field?: string) {
	// Validate that any injected CDN delay has elapsed
	if (fragmentRec.cdndelay) {
		if (!fragmentRec.timestamp) {
			console.log('Refusing to serve cdndelay ' + (field ?? 'fragment') + ' without timestamp');
			return false;
		} else {
			var iusElapsedLiveMilliseconds =
				Date.now().valueOf() - (fragmentRec.cdndelay + fragmentRec.timestamp.valueOf());
			if (iusElapsedLiveMilliseconds < 0) {
				console.log(
					'Refusing to serve cdndelay ' +
						(field ?? 'fragment') +
						' due to ' +
						iusElapsedLiveMilliseconds +
						' ms of delay remaining'
				);
				return false; // refuse to serve the blob due to artificial CDN delay
			}
		}
	}
	return true;
}

function isSyncReady(f?: BroadCastMatchPart) {
	return (
		f != null &&
		typeof f == 'object' &&
		f.full != null &&
		f.delta != null &&
		f.tick != null &&
		f.endtick != null &&
		f.timestamp &&
		checkFragmentCdnDelayElapsed(f)
	);
}

function getMatchBroadcastEndTick(broadcasted_match: BroadCastMatchPart[]) {
	for (var f = broadcasted_match.length - 1; f >= 0; f--) {
		if (broadcasted_match[f]!.endtick) return broadcasted_match[f]!.endtick;
	}
	return 0;
}

function respondMatchBroadcastSync(
	param: any,
	response: ServerResponse,
	broadcasted_match: BroadCastMatchPart[],
	token_redirect?: string
) {
	var nowMs = Date.now();
	response.setHeader('Cache-Control', 'public, max-age=3');
	response.setHeader('Expires', new Date(nowMs + 3000).toUTCString()); // whatever we find out, this information is going to be stale 3-5 seconds from now
	// TODO: if you use this reference script in production (which you should not), make sure you set all the necessary headers for your CDN to relay the expiration headers to PoPs and clients

	var match_field_0 = broadcasted_match[0];
	if (match_field_0 != null && match_field_0.start != null) {
		var fragment = param.query.fragment,
			frag = null;

		if (fragment == null) {
			// skip the last 3-4 fragments, to let the front-running clients get 404, and CDN wait for 3+ seconds, and re-try that fragment again
			// then go back another 3 fragments that are the buffer size for the client - we want to have the full 3 fragments ahead of whatever the user is streaming for the smooth experience
			// if we don't, then legit in-sync clients will often hit CDN-cached 404 on buffered fragments
			fragment = Math.max(0, broadcasted_match.length - 8);

			if (fragment >= 0 && fragment >= match_field_0.signup_fragment!) {
				// can't serve anything before the start fragment
				var f = broadcasted_match[fragment];
				if (isSyncReady(f)) frag = f;
			}
		} else {
			if (fragment < match_field_0.signup_fragment) fragment = match_field_0.signup_fragment;

			for (; fragment < broadcasted_match.length; fragment++) {
				var f = broadcasted_match[fragment];
				if (isSyncReady(f)) {
					frag = f;
					break;
				}
			}
		}

		if (frag) {
			console.log('Sync fragment ' + fragment);
			// found the fragment that we want to send out
			response.writeHead(200, { 'Content-Type': 'application/json' });
			if (match_field_0.protocol == null) match_field_0.protocol = 5; // Source2 protocol: 5

			var jso = {
				tick: frag.tick,
				endtick: frag.endtick,
				maxtick: getMatchBroadcastEndTick(broadcasted_match),
				rtdelay: (nowMs - frag.timestamp) / 1000, // delay of this fragment from real-time, in seconds
				rcvage: (nowMs - broadcasted_match[broadcasted_match.length - 1]!.timestamp) / 1000, // Receive age: how many seconds since relay last received data from game server
				fragment: fragment,
				signup_fragment: match_field_0.signup_fragment,
				tps: match_field_0.tps,
				keyframe_interval: match_field_0.keyframe_interval,
				map: match_field_0.map,
				protocol: match_field_0.protocol
			} as any;

			if (token_redirect) jso.token_redirect = token_redirect;

			response.end(JSON.stringify(jso));
			return; // success!
		}

		// not found
		response.writeHead(405, 'Fragment not found, please check back soon');
	} else {
		response.writeHead(404, 'Broadcast has not started yet');
	}

	response.end();
}

function postField(
	request: IncomingMessage,
	param: UrlWithParsedQuery,
	response: ServerResponse,
	broadcasted_match: BroadCastMatchPart[],
	fragment: number,
	field: string
) {
	// decide on what exactly the response code is - we have enough info now
	if (field == 'start') {
		console.log('Start tick ' + param.query.tick + ' in fragment ' + fragment);
		response.writeHead(200);

		if (broadcasted_match[0] == null) broadcasted_match[0] = {} as BroadCastMatchPart;
		if (broadcasted_match[0]!.signup_fragment! > fragment)
			console.log(
				'UNEXPECTED new start fragment ' + fragment + ' after ' + broadcasted_match[0]!.signup_fragment
			);

		broadcasted_match[0]!.signup_fragment = fragment;
		fragment = 0; // keep the start in the fragment 0
	} else {
		if (broadcasted_match[0] == null) {
			console.log('205 - need start fragment');
			response.writeHead(205);
		} else {
			if (broadcasted_match[0].start == null) {
				console.log('205 - need start data');
				response.writeHead(205);
			} else {
				response.writeHead(200);
			}
		}
		if (broadcasted_match[fragment] == null) {
			//console.log("Creating fragment " + fragment + " in match_broadcast " + path[1]);
			broadcasted_match[fragment] = {} as BroadCastMatchPart;
		}
	}

	for (const q in param.query) {
		var v = param.query[q] as string,
			n = parseInt(v);
		// @ts-ignore
		broadcasted_match[fragment][q] = v == n ? n : v;
	}

	var body = [] as Buffer[];
	request.on('data', function (data) {
		body.push(data);
	});
	request.on('end', function () {
		var totalBuffer = Buffer.concat(body);
		if (field == 'start')
			console.log(
				'Received [' +
					fragment +
					'].' +
					field +
					', ' +
					totalBuffer.length +
					' bytes in ' +
					body.length +
					' pieces'
			);
		response.end(); // we can end the response before gzipping the received data

		var originCdnDelay = request.headers['x-origin-delay'] as string;
		if (originCdnDelay && parseInt(originCdnDelay) > 0) {
			// CDN delay must match for both fragments, overwrite is ok
			broadcasted_match[fragment]!.cdndelay = parseInt(originCdnDelay);
		}

		zlib.gzip(totalBuffer, function (error, compressedBlob) {
			if (error) {
				console.log('Cannot gzip ' + totalBuffer.length + ' bytes: ' + error);
				broadcasted_match[fragment]![field as keyof BroadCastMatchPart] = totalBuffer;
			} else {
				//console.log(fragment + "/" + field + " " + totalBuffer.length + " bytes, compressed " + compressedBlob.length + " to " + ( 100 * compressedBlob.length / totalBuffer.length ).toFixed(1) + "%" );
				broadcasted_match[fragment]![(field + '_ungzlen') as keyof BroadCastMatchPart] = totalBuffer.length;
				broadcasted_match[fragment]![field as keyof BroadCastMatchPart] = compressedBlob;
			}

			// flag the fragment as received and ready for ingestion by CDN (provided "originCdnDelay" is satisfied)
			broadcasted_match[fragment]!.timestamp = Date.now();
		});
	});
}

function serveBlob(request: IncomingMessage, response: ServerResponse, fragmentRec: BroadCastMatchPart, field: string) {
	var blob = fragmentRec[field as keyof BroadCastMatchPart];
	var ungzipped_length = fragmentRec[(field + '_ungzlen') as keyof BroadCastMatchPart];

	// Validate that any injected CDN delay has elapsed
	if (!checkFragmentCdnDelayElapsed(fragmentRec, field)) {
		blob = null; // refuse to serve the blob due to artificial CDN delay
	}

	if (blob == null) {
		response.writeHead(404, 'Field not found');
		response.end();
	} else {
		// we have data to serve
		if (Buffer.isBuffer(blob)) {
			// https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11
			const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
			if (ungzipped_length) {
				headers['Content-Encoding'] = 'gzip';
			}
			response.writeHead(200, headers);
			response.end(blob);
		} else {
			response.writeHead(404, 'Unexpected field type ' + typeof blob); // we only serve strings
			console.log('Unexpected Field type ' + typeof blob); // we only serve strings
			response.end();
		}
	}
}

function getStart(
	request: IncomingMessage,
	response: ServerResponse,
	broadcasted_match: BroadCastMatchPart[],
	fragment: number,
	field: string
) {
	if (broadcasted_match[0] == null || broadcasted_match[0].signup_fragment != fragment) {
		respondSimpleError(request.url, response, 404, 'Invalid or expired start fragment, please re-sync');
	} else {
		// always take start data from the 0th fragment
		serveBlob(request, response, broadcasted_match[0], field);
	}
}

function getField(
	request: IncomingMessage,
	response: ServerResponse,
	broadcasted_match: BroadCastMatchPart[],
	fragment: number,
	field: string
) {
	serveBlob(request, response, broadcasted_match[fragment]!, field);
}

function getFragmentMetadata(response: ServerResponse, broadcasted_match: BroadCastMatchPart[], fragment: number) {
	var res = {} as Record<string, any>;
	for (var field in broadcasted_match[fragment]) {
		var f = broadcasted_match[fragment]![field as keyof BroadCastMatchPart];
		if (typeof f == 'number') res[field] = f;
		else if (Buffer.isBuffer(f)) res[field] = f.length;
	}
	response.writeHead(200, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify(res));
}

function processRequestUnprotected(request: IncomingMessage, response: ServerResponse) {
	// https://nodejs.org/api/http.html#http_class_http_incomingmessage
	var uri = decodeURI(request.url!);

	var param = url.parse(uri, true);
	var path = param.pathname!.split('/');
	path.shift(); // the first element is always empty, because the path starts with /
	response.httpVersion! = '1.0';

	var prime = path.shift();

	if (prime == null || prime == '' || prime == 'index.html') {
		respondSimpleError(uri, response, 401, 'Unauthorized');
		return;
	}

	var isPost;
	if (request.method == 'POST') {
		isPost = true;
		// TODO: if you use this reference script in production (which you should not), make sure you check "originAuth" header - it must match your game server private setting!
		// if ( !verify request.headers['x-origin-auth'] equals "SuPeRsEcUrEsErVeR" ) {
		// 	console.log("Unauthorized POST to " + request.url + ", origin auth " + originAuth);
		// 	respondSimpleError(uri, response, 403, "Not Authorized");
		// 	return;
		// }
	} else if (request.method == 'GET') {
		isPost = false;
		// TODO: if you use this reference script in production (which you should not), make sure you check "originAuth" header - it must match your CDN authorization setting!
		// if ( !verify request.headers['x-origin-auth'] equals "SuPeRsEcUrE_CDN_AuTh" ) {
		// 	respondSimpleError(uri, response, 403, "Not Authorized");
		// 	return;
		// }
	} else {
		respondSimpleError(uri, response, 404, 'Only POST or GET in this API');
		return;
	}

	var broadcasted_match = match_broadcasts[prime]!;
	if (broadcasted_match == null) {
		// the match_broadcast does not exist
		if (isPost) {
			// TODO: if you use this reference script in production (which you should not), make sure that your intent is to create a new match_broadcast on any POST request
			console.log("Creating match_broadcast '" + prime + "'");
			token_redirect_for_example = prime; // TODO: implement your own logic here or somewhere else that decides which token_redirect to use for unified playcast URL/CDN/etc.
			match_broadcasts[prime] = broadcasted_match = [];
			stats.new_match_broadcasts++;
		} else {
			if (prime == 'sync') {
				// TODO: implement your own logic here or somewhere else that decides which token_redirect to use for unified playcast URL/CDN/etc.
				// This reference implementation (which you should not use in production) will try to redirect to whatever "token_redirect_for_example"
				if (token_redirect_for_example && match_broadcasts[token_redirect_for_example]) {
					respondMatchBroadcastSync(
						param,
						response,
						match_broadcasts[token_redirect_for_example]!,
						token_redirect_for_example
					);
					stats.sync++;
				} else {
					respondSimpleError(
						uri,
						response,
						404,
						'match_broadcast ' + prime + ' not found and no valid token_redirect'
					);
					stats.err[0]!++;
				}
			} else {
				// GET requests cannot create new match_broadcasts in this reference implementation
				respondSimpleError(uri, response, 404, 'match_broadcast ' + prime + ' not found'); // invalid match_broadcast
				stats.err[0]!++;
			}
			return;
		}
	}

	var requestFragmentOrKey = path.shift();
	if (requestFragmentOrKey == null || requestFragmentOrKey == '') {
		if (isPost) {
			respondSimpleError(uri, response, 405, 'Invalid POST: no fragment or field');
			stats.err[1]!++;
		} else {
			respondSimpleError(uri, response, 401, 'Unauthorized');
		}
		return;
	}

	stats.requests++;

	const fragment = parseInt(requestFragmentOrKey);

	if (fragment.toString() != requestFragmentOrKey) {
		if (requestFragmentOrKey == 'sync') {
			//setTimeout(() => {
			respondMatchBroadcastSync(param, response, broadcasted_match);
			//}, 2000); // can be useful for your debugging additional latency on the /sync response
			stats.sync++;
		} else {
			respondSimpleError(uri, response, 405, 'Fragment is not an int or sync');
			stats.err[2]!++;
		}
		return;
	}

	var field = path.shift();
	if (isPost) {
		stats.post_field++;
		if (field != null) {
			postField(request, param, response, broadcasted_match, fragment, field);
		} else {
			respondSimpleError(uri, response, 405, 'Cannot post fragment without field name');
			stats.err[3]!++;
		}
	} else {
		if (field == 'start') {
			getStart(request, response, broadcasted_match, fragment, field);
			stats.get_start++;
		} else if (broadcasted_match[fragment] == null) {
			stats.err[4]!++;
			response.writeHead(404, 'Fragment ' + fragment + ' not found');
			response.end();
		} else if (field == null || field == '') {
			getFragmentMetadata(response, broadcasted_match, fragment);
			stats.get_frag_meta++;
		} else {
			getField(request, response, broadcasted_match, fragment, field);
			stats.get_field++;
		}
	}
}

function processRequest(request: IncomingMessage, response: ServerResponse) {
	try {
		processRequestUnprotected(request, response);
	} catch (err: any) {
		console.log(new Date().toUTCString() + ' Exception when processing request ' + request.url);
		console.log(err);
		console.log(err.stack);
	}
}

var newServer = http.createServer(processRequest).listen(port);
if (newServer) console.log(new Date().toUTCString() + ' Started in ' + __dirname + ' on port ' + port);
else console.log(new Date().toUTCString() + ' Failed to start on port ' + port);
