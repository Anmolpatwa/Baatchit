
import { useThemeStore } from '../store/useThemeStore'
import { Loader2Icon, LoaderCircleIcon, LoaderPinwheel } from 'lucide-react'


const PageLoader = () => {
  const {theme} = useThemeStore()
  return (
    <div className='min-h-screen flex items-center justify-center' data-theme={theme}>
        <LoaderCircleIcon className='animate-spin w-10 h-10 text-primary'/></div>
  )
}

export default PageLoader