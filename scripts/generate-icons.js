/**
 * Regenerates every MoneyJot icon — for this site and for the Expo app next door — from a
 * single master artwork.
 *
 *   node scripts/generate-icons.js [path/to/source.png]
 *
 * The master is a square PNG with transparent margins. Those margins differ per target, so
 * the art is trimmed to its bounding box first and then re-padded to whatever each platform
 * wants: near edge-to-edge for favicons, inset for iOS, and well inside the crop circle for
 * Android adaptive icons. Nothing here scales the raw master directly.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const WEB = path.join(__dirname, '..')
const APP = path.join(WEB, '..', 'moneyjot')
const SRC = process.argv[2] || path.join(__dirname, 'moneyjot-icon-source.png')

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

/** Packs PNGs into a multi-size .ico, which sharp cannot write itself. */
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  const dir = []
  let offset = 6 + entries.length * 16
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += buf.length
    dir.push(e)
  }
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.buf)])
}

async function main() {
  const art = await sharp(SRC).trim({ threshold: 1 }).png().toBuffer()
  const { width: aw, height: ah } = await sharp(art).metadata()

  /** Centres the art on a square canvas, scaled so its height is `fill` of that canvas. */
  async function square({ size, fill, bg = TRANSPARENT, input = art, opaque = false }) {
    const h = Math.round(size * fill)
    const w = Math.round((h * aw) / ah)
    const scaled = await sharp(input).resize(w, h, { fit: 'fill' }).png().toBuffer()

    let canvas = sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    }).composite([
      { input: scaled, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) },
    ])
    if (opaque) canvas = canvas.flatten({ background: bg })
    return canvas.png().toBuffer()
  }

  // Android's themed icon is a single-colour stencil. A plain alpha silhouette turns the
  // whole mark into a blob, so the pale interior details are punched back out.
  const { data, info } = await sharp(art).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const stencil = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    const paleGreen = g > 200 && r < 240 // ruled lines and the header band
    const gold = r > 230 && g > 170 && b < 120 // coin face and nib
    stencil[o + 3] = a > 40 && !paleGreen && !gold ? a : 0
  }
  const mono = await sharp(stencil, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()

  const write = (target, buf) => {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, buf)
    console.log(`  ${path.relative(path.join(WEB, '..'), target)}  ${(buf.length / 1024).toFixed(1)} KB`)
  }

  console.log(`source ${SRC} → art ${aw}x${ah}\n`)

  write(path.join(WEB, 'public/moneyjot-logo.png'), await square({ size: 512, fill: 1 }))
  write(path.join(WEB, 'app/icon.png'), await square({ size: 512, fill: 0.98 }))
  write(
    path.join(WEB, 'app/apple-icon.png'),
    await square({ size: 180, fill: 0.74, bg: WHITE, opaque: true })
  )
  write(
    path.join(WEB, 'app/favicon.ico'),
    buildIco(
      await Promise.all([16, 32, 48].map(async (size) => ({ size, buf: await square({ size, fill: 1 }) })))
    )
  )

  // iOS rejects transparency in app icons, so the white page is baked in there only.
  write(
    path.join(APP, 'assets/images/icon.png'),
    await square({ size: 1024, fill: 0.74, bg: WHITE, opaque: true })
  )
  write(path.join(APP, 'assets/images/splash-icon.png'), await square({ size: 1024, fill: 0.86 }))
  write(path.join(APP, 'assets/images/logo.png'), await square({ size: 512, fill: 1 }))
  write(path.join(APP, 'assets/images/favicon.png'), await square({ size: 48, fill: 1 }))

  // Adaptive icons are cropped to a circle, so the art stays inside the ~60% safe zone.
  write(
    path.join(APP, 'assets/images/android-icon-foreground.png'),
    await square({ size: 1024, fill: 0.56 })
  )
  write(
    path.join(APP, 'assets/images/android-icon-background.png'),
    await sharp({ create: { width: 1024, height: 1024, channels: 3, background: WHITE } })
      .png()
      .toBuffer()
  )
  write(
    path.join(APP, 'assets/images/android-icon-monochrome.png'),
    await square({ size: 1024, fill: 0.56, input: mono })
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
