type AppLogoIconProps = React.ImgHTMLAttributes<HTMLImageElement>;

export default function AppLogoIcon(props: AppLogoIconProps) {
    const logoSrc = '/images/insurepal-logo.png';

    const logoAlt = 'Insure Pal';

    return (
        <img
            src={logoSrc}
            alt={logoAlt}
            className="h-16 w-auto object-contain" // fits inside h-24 navbar
            {...props} // allow caller to override className, width, etc.
        />
    );
}
