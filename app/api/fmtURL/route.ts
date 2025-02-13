import { getStreamURL } from "@shiminiku/yt-o"

export async function POST(req: Request) {
  const { fmt, basejsURL } = await req.json()
  if (!fmt) {
    return new Response("fmt needed", { status: 400 })
  }
  if (!fmt["url"] && !fmt["signatureCipher"]) {
    return new Response('fmt needs ["url"] or ["signatureCipher"]', { status: 400 })
  }
  if (!basejsURL) {
    return new Response("basejs needed", { status: 400 })
  }

  return new Response(await getStreamURL(fmt, basejsURL))
}
