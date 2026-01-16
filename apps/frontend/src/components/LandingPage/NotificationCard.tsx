export default function NotificationCard({name, message, time}: {name: string; message: string; time: string}) {
    return (
        <div className="flex items-center justify-center p-1 mt-1">
            <div className="">
                <div className="flex items-center gap-1">
                    {/* Icon */}
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                            <svg 
                                className="w-5 h-5 text-white" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                                <path d="M2 2l7.586 7.586"/>
                                <circle cx="11" cy="11" r="2"/>
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1 mb-0.5">
                            <h3 className="text-white text-sm font-semibold">{name}</h3>
                            <span className="text-gray-500 text-xs">· {time} ago</span>
                        </div>
                        <p className="text-gray-400 text-xs">{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}