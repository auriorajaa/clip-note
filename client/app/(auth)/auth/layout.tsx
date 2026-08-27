export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left: Logo + Auth Form */}
            <div className="flex flex-col p-6 md:p-10">
                {/* Logo */}
                <div className="flex justify-center lg:justify-start">
                    <a
                        href="/"
                        className="flex items-center gap-2 font-medium"
                    >
                        <div className="flex size-6 items-center justify-center rounded-md">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="56"
                                height="40"
                                viewBox="0 0 56 40"
                                fill="none"
                                aria-label="Clip Note logo"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M23.3333 0C23.7194 0 24.1033 0.00932962 24.4847 0.0280265C24.4924 0.0284028 24.4989 0.0222809 24.4989 0.0145938C24.4989 0.00716838 24.5049 0.0011489 24.5123 0.0011489H45.8418C46.2974 0.00137965 46.6667 0.373466 46.6667 0.83295C46.6666 1.05356 46.5798 1.26515 46.4251 1.42119L40.8322 7.05882H52.7444C53.5415 7.05882 54.27 7.52957 54.5456 8.27757C55.4857 10.829 56 13.5892 56 16.4706C56 29.4655 45.5533 40 32.6667 40C32.2808 40 31.8971 39.9896 31.5158 39.9709C31.5078 39.9705 31.5011 39.9768 31.5011 39.9848C31.5011 39.9926 31.4949 39.9989 31.4871 39.9989H10.1582C9.7026 39.9986 9.33333 39.6265 9.33333 39.1671C9.33336 38.9464 9.42022 38.7348 9.57487 38.5788L15.1655 32.9412H3.25562C2.45846 32.9412 1.73002 32.4704 1.4544 31.7224C0.514256 29.171 0 26.4109 0 23.5294C0 10.5345 10.4467 0 23.3333 0ZM31.3177 16.6556C29.3919 14.383 26.5301 12.9412 23.3333 12.9412C17.5343 12.9412 12.8333 17.6817 12.8333 23.5294C12.8333 24.7672 13.0456 25.9547 13.4326 27.0588H20.9989L24.6823 23.3444C26.6081 25.617 29.4699 27.0588 32.6667 27.0588C38.4657 27.0588 43.1667 22.3183 43.1667 16.4706C43.1667 15.2328 42.9544 14.0453 42.5674 12.9412H35.0011L31.3177 16.6556Z"
                                    fill="#3754FA"
                                />
                            </svg>
                        </div>

                        Clip Note
                    </a>
                </div>

                {/* Page-specific content */}
                <div className="flex flex-1 items-start justify-center pt-10 lg:items-center lg:pt-0">
                    <div className="w-full max-w-xs sm:max-w-sm">
                        {children}
                    </div>
                </div>
            </div>

            {/* Right: Advertisement */}
            <div className="relative hidden overflow-hidden bg-muted lg:flex">
                <div className="flex h-full w-full items-center justify-center p-12 xl:p-20">
                    <div className="w-full max-w-lg">
                        <h2 className="text-4xl font-bold tracking-tight xl:text-5xl">
                            Turn hours of YouTube into minutes of knowledge.
                        </h2>

                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Clip Note uses AI to transform YouTube videos into
                            clear, concise summaries, helping you learn faster
                            without watching every minute.
                        </p>

                        <div className="mt-8 space-y-6">
                            <div>
                                <h3 className="font-semibold">
                                    AI-Powered Summaries
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Get the key ideas and insights from any
                                    YouTube video in seconds.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold">
                                    Save Your Time
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Skip the unnecessary parts and focus on
                                    what actually matters.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold">
                                    Learn with Clear Notes
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Turn long videos into simple,
                                    easy-to-read notes you can revisit
                                    anytime.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}