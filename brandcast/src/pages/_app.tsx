import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { AuthProvider } from '@/context/AuthContext'
import theme from '@/theme'
import { CompanyProvider } from '@/context/CompanyContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AuthProvider>
        <CompanyProvider>
          <Component {...pageProps} />
        </CompanyProvider>
      </AuthProvider>
    </ChakraProvider>
  )
}
