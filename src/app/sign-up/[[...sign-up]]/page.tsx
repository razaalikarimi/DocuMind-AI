import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[100px]" />
      
      {/* Grid Pattern */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" 
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-xl font-bold tracking-wider text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
          </div>
          <span className="font-outfit text-2xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">DocuMind AI</span>
        </div>
        
        <div className="w-full shadow-2xl shadow-indigo-950/50 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/40 backdrop-blur-xl">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full border-0 bg-transparent shadow-none",
                card: "bg-transparent border-0 shadow-none p-6 sm:p-8",
                headerTitle: "text-white font-extrabold text-2xl",
                headerSubtitle: "text-slate-400 font-medium",
                socialButtonsBlockButton: "bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all duration-200",
                socialButtonsBlockButtonText: "text-slate-200 font-medium",
                dividerLine: "bg-slate-800",
                dividerText: "text-slate-500 bg-transparent",
                formLabel: "text-slate-300 font-semibold text-sm",
                formInput: "bg-slate-900/60 border border-slate-800 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200",
                formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white font-bold transition-all duration-200 shadow-lg shadow-indigo-500/20",
                footerActionText: "text-slate-400",
                footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold transition-all duration-200"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
