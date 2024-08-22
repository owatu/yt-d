import { useState } from "react"
import { URLCache } from "../app/page"
import { Help, HELPS } from "../lib/Helps"
import style from "/styles/StreamsTable.module.scss"

interface Format {
  url?: string
  signatureCipher?: string
}

type CacheUpdater = (f: (pv: URLCache) => URLCache) => void

function genFmtURL(f: Format, updateCache: CacheUpdater) {
  const yt_dp = (window as any).yt_dp
  let url = f.url
  if (f.signatureCipher) {
    const sc = new URLSearchParams(f.signatureCipher)
    const s = sc.get("s")
    const sp = sc.get("sp")
    url = sc.get("url") || undefined

    const deS = yt_dp.deSC(s)

    url += `&${sp}=${deS}`
  }

  if (!url) return

  const pUrl = new URL(url)
  const nt = pUrl.searchParams.get("n")
  const deNT = yt_dp.getNToken(nt)
  pUrl.searchParams.set("n", deNT)

  updateCache((pv) => ({ ...pv, [f.url || f.signatureCipher || ""]: pUrl.toString() }))
}

function DownloadLink({ f, urlCache, updateCache }: { f: Format; urlCache: URLCache; updateCache: CacheUpdater }) {
  if (f.url && urlCache[f.url]) {
    return (
      <a target="_blank" href={urlCache[f.url]} rel="noreferrer">
        開く
      </a>
    )
  } else if (f.signatureCipher && urlCache[f.signatureCipher]) {
    return (
      <a target="_blank" href={urlCache[f.signatureCipher]} rel="noreferrer">
        開く
      </a>
    )
  } else {
    const tryLoop = () => {
      try {
        genFmtURL(f, updateCache)
      } catch {
        setTimeout(tryLoop, 1000)
      }
    }
    tryLoop()
    return "取得中…"
  }
}

interface Filter {
  label: string
  filter: string
}
const FILTERS: Filter[] = [
  { label: "MP4", filter: "mp4" },
  { label: "WebM", filter: "webm" },
  { label: "", filter: "" },
  { label: "H.264", filter: "avc1" },
  { label: "VP9", filter: "vp9" },
  { label: "AV1", filter: "av01" },
  { label: "", filter: "" },
  { label: "AAC", filter: "mp4a" },
  { label: "Opus", filter: "opus" },
]

export function StreamsTable({
  streams,
  urlCache,
  updateCache,
  showHelp,
  radioId,
}: {
  streams: any[]
  urlCache: URLCache
  updateCache: CacheUpdater
  showHelp: (help: Help) => void
  radioId: string
}) {
  const radioGroup = `stream-filter--${radioId}`
  const [filterId, setFilter] = useState<number | null>(null)

  return (
    <div>
      <div>
        {FILTERS.map((f, i) => (
          <span key={i}>
            {f.filter.length === 0 ? (
              "・"
            ) : (
              <>
                <input
                  type="radio"
                  name={radioGroup}
                  id={`${radioGroup}--${f.filter}`}
                  checked={filterId === i}
                  onClick={() => {
                    setFilter((p) => (p === i ? null : i))
                  }}
                />
                <label htmlFor={`${radioGroup}--${f.filter}`}>{f.label}</label>
              </>
            )}
          </span>
        ))}
      </div>

      <div className={style["overflow-scroll"]}>
        <table className={style["table-streaming"]}>
          <tbody>
            <tr>
              <th>
                <abbr title="おそらく、内部的に使われている形式の識別子またはタグ">itag</abbr>
              </th>
              <th>
                MIMEタイプ
                <button className={style["help-btn"]} onClick={() => showHelp(HELPS.mimeType)}>
                  ?
                </button>
              </th>
              <th>画質</th>
              <th>ビットレート</th>
              <th>サイズ</th>
              <th>リンク</th>
            </tr>
            {streams
              ?.filter((s) => (filterId !== null ? s.mimeType.includes(FILTERS[filterId].filter) : true))
              ?.map?.((stream: any, i: number) => {
                let bitrateSuffix = "Kbps"
                let b = stream.averageBitrate / 1000
                if (b / 1000 >= 1) {
                  b = b / 1000
                  bitrateSuffix = "Mbps"
                }
                let bitrate = b.toFixed(3)

                let lenSuffix = ""
                let len = parseInt(stream.contentLength)
                if (len / 1000 >= 1) {
                  len /= 1000
                  lenSuffix = "KB"

                  if (len / 1000 >= 1) {
                    len /= 1000
                    lenSuffix = "MB"
                  }
                }
                const length = len.toFixed(2)

                return (
                  <tr key={i}>
                    <td>{stream.itag}</td>
                    <td>
                      <code title={stream.mimeType}>
                        {stream.mimeType.startsWith("video") ? (
                          <>
                            <span className={style["video-mimetype-text"]}>{stream.mimeType.slice(0, 5)}</span>
                            {stream.mimeType.slice(5)}
                          </>
                        ) : (
                          <>
                            <span className={style["audio-mimetype-text"]}>{stream.mimeType.slice(0, 5)}</span>
                            {stream.mimeType.slice(5)}
                          </>
                        )}
                      </code>
                    </td>
                    <td>
                      {stream.height ? stream.height + "p" : ""}
                      {stream.fps ? (
                        stream.fps + "fps"
                      ) : (
                        <span className={style["gray-text"]}>
                          {stream.isDrc ? (
                            <abbr title="Dynamic range compression (ダイナミックレンジ圧縮)">DRC</abbr>
                          ) : (
                            "(音声)"
                          )}
                        </span>
                      )}
                    </td>
                    <td className={style["bitrate-text"]}>
                      {bitrate} {bitrateSuffix}
                    </td>
                    <td className={style["bitrate-text"]}>
                      {length} {lenSuffix}
                    </td>
                    <td>
                      <DownloadLink f={stream} urlCache={urlCache} updateCache={updateCache} />
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
