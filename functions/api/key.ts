import { b64ToUrlEncoded, exportPublicKeyPair } from './util';

interface Env {
	PETERS: KVNamespace;
    SERVER_KEY: any;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    let response: Response;
    try {
        response = new Response(b64ToUrlEncoded(exportPublicKeyPair(JSON.parse(context.env.SERVER_KEY))))
    } catch (err: any) {
        response = new Response(err, {status: 400})
    }
    return response;
}
