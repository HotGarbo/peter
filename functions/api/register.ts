import { arrayBufferToBase64, b64ToUrlEncoded, exportPublicKeyPair, stringToU8Array } from './util';

interface Env {
	PETERS: KVNamespace;
	SERVER_KEY: string;
	SUB: string;
}

interface Subscription {
	endpoint: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const req: Subscription = await context.request.json();
	let response: Response;
	try {
		const existingKey = await context.env.PETERS.get(req.endpoint);
		if (existingKey !== null) {
			throw new Error("Already registered");
		}
		// Cache of tokens by push server
		context.data.tokenCache = {};
		const res = await notify(context, req.endpoint);
		if (res.status != 201) {
			throw new Error(await r.text())
		}
		context.waitUntil(spamAndAdd(context, req.endpoint));
		response = new Response("freakin' sweet!");
	} catch (err: any) {
		console.error(err);
		response = new Response(err, { status: 400 });
	}
	return response;
}

const notify = async (context: EventContext<Env, any, Record<string, unknown>>, endpoint: string) => {
	const vapidHeaders = await generateHeaders(context, endpoint);
	const req = new Request(endpoint, {
		method: 'POST',
		headers: {
			TTL: '2419200',
			Authorization: `vapid t=${vapidHeaders.token}, k=${vapidHeaders.serverKey}`
		}
	});
	return fetch(req);
}

const spamAndAdd = async (context: EventContext<Env, any, Record<string, unknown>>, endpoint: string) => {
	let cursor = "";
	while (1) {
		const list = await context.env.PETERS.list({ cursor: cursor });
		for (const k of list.keys) {
			notify(context, k.name).then(r => {
				if (r.status != 201) {
					console.log(`Deleting ${k.name} because ${r.statusText}`)
					return context.env.PETERS.delete(k.name);
				}
			})
		}
		if (list.list_complete) {
			break
		}
		cursor = list.cursor;
	}
	await context.env.PETERS.put(endpoint, "");
}


// Below functions ripped from https://github.com/K0IN/Notify/blob/main/app/src/webpush/vapid.ts 

const objToUrlB64 = (obj: { [key: string]: string | number | null }) => b64ToUrlEncoded(btoa(JSON.stringify(obj)));

async function signData(token: string, applicationKeys: JsonWebKey): Promise<string> {
	const key = await crypto.subtle.importKey('jwk',
		applicationKeys,
		{ name: 'ECDSA', namedCurve: 'P-256' },
		true,
		['sign']);

	const sig = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: { name: 'SHA-256' } },
		key,
		stringToU8Array(token));

	return b64ToUrlEncoded(arrayBufferToBase64(sig));
}

async function generateHeaders(context: EventContext<Env, any, Record<string, unknown>>, endpoint: string): Promise<{ token: string, serverKey: string }> {
	const applicationServerKeys = JSON.parse(context.env.SERVER_KEY);
	const sub = context.env.SUB;
	const serverKey = b64ToUrlEncoded(exportPublicKeyPair(<any>applicationServerKeys));
	const pushService = new URL(endpoint);
	const aud = `${pushService.protocol}//${pushService.host}`;
	if (aud in context.data.tokenCache) {
		return { token: context.data.tokenCache[aud], serverKey };
	}
	const header = {
		'typ': 'JWT',
		'alg': 'ES256'
	};
	const now = new Date();
	const body = {
		'aud': aud,
		// Round expiration date to keep push servers happy
		'exp': Math.round(now.setMinutes(0, 0, 0) / 1000) + (12 * 60 * 60),
		'sub': String(sub)
	};

	const unsignedToken = objToUrlB64(header) + '.' + objToUrlB64(body);
	const signature = await signData(unsignedToken, applicationServerKeys);
	const token = `${unsignedToken}.${signature}`;
	context.data.tokenCache[aud] = token;
	return { token, serverKey };
}

