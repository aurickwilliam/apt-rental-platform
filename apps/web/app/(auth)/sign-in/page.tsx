import Image from "next/image";
import AuthWrapper from "../components/AuthWrapper";

export default function SignIn() {
  return (
    <main className="flex w-screen h-screen overflow-hidden">
      {/* Right Panel */}
      <div 
        className="flex-1 bg-amber-200 relative hidden md:flex"
        style={{backgroundImage: "url('/building-bg2.jpg')"}}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <div className="relative z-10 p-12 h-full flex flex-col justify-between">
          <Image 
            src="/logo/logo-name.svg"
            alt="Logo"
            width={200}
            height={150}
          />

          <h2 className="text-5xl font-poppins font-semibold text-white">
            Your Next Home is Waiting.
          </h2>
        </div>
      </div>

      <AuthWrapper type="sign-in" />
    </main>
  );
}