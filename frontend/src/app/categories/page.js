'use client'; 
 
import { useEffect } from 'react'; 
import { useRouter } from 'next/navigation'; 
 
export default function CategoriesRedirect() { 
  const router = useRouter(); 
 
  useEffect(() => { 
    router.replace('/master/categories'); 
  }, [router]); 
 
  return ( 
    <div className="flex items-center justify-center min-h-screen"> 
      <div className="text-center"> 
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black/10 mx-auto"></div> 
        <p className="mt-4 text-[#333]">Redirecting to Master Data - Categories...</p> 
      </div> 
    </div> 
  ); 
} 
