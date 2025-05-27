import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'user admin',
  description: 'user admin',
  generator: 'user admin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
       <header className="header">
        <div className="container">
            <div className="header__content">
                <a href="index.html" className="logo">
                    <h1 className="logo__text">ConcertHub</h1>
                </a>
                <nav className="nav">
                    <ul className="nav__list">
                        <li className="nav__item"><a href="https://l1ubek.github.io/index.html" className="nav__link nav__link--active">Home</a></li>
                        <li className="nav__item"><a href="https://l1ubek.github.io/events.html" className="nav__link">Events</a></li>
                        <li className="nav__item"><a href="https://l1ubek.github.io/my-tickets.html" className="nav__link">My Tickets</a></li>
                        <li className="nav__item"><a href="https://l1ubek.github.io/concerts.html" className="nav__link">Concerts</a></li>                        
                        <li className="nav__item"><a href="http://localhost:3000" className="nav__link nav__link--btn">Login</a></li>
                    </ul>
                </nav>
                <button className="menu-toggle" aria-label="Toggle menu">
                    <span className="menu-toggle__line"></span>
                    <span className="menu-toggle__line"></span>
                    <span className="menu-toggle__line"></span>
                </button>
            </div>
        </div>
    </header>
      <body>{children}</body>
    </html>
  )
}
