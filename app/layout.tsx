import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Bingo Musical - Spotify",
  description: "Crea cartones de bingo con las playlists de Spotify",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
