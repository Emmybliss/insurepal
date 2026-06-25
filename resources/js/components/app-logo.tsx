export default function AppLogo() {
    const logoSrc = '/images/insurepal-logo.png';
    const logoAlt = 'Insure Pal';
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md shadow-2xl">
                <img src={logoSrc} alt={logoAlt} width={100} height={100} className="object-cover" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="mb-0.5 truncate text-lg leading-tight font-semibold">{logoAlt}</span>
                <span className="mb-0.5 truncate text-xs leading-tight">Your Insurance Partner</span>
            </div>
        </>
    );
}
