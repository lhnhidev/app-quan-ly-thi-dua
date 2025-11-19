import { type IconType } from "react-icons";

type PropType = {
  title: string;
  subtitle: string;
  logo: IconType;
};

const Header = ({ title, subtitle, logo: Logo }: PropType) => {
  return (
    <div>
      <header className="flex items-center space-x-4 bg-gray-100 p-4">
        <Logo className="h-8 w-8 text-[var(--primary-color)]" />
        <div>
          <h1 className="text-xl font-bold uppercase text-[var(--primary-color)]">
            {title}
          </h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </header>
    </div>
  );
};
export default Header;
