import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Appbar } from './components/Appbar.tsx'
import Footer from './components/Footer.tsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Appbar />
      <App />
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-neutral-700/90 bg-neutral-950/95 text-neutral-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.4)]",
          descriptionClassName: "text-neutral-300",
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
