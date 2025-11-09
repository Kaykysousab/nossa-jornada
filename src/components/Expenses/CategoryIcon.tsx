import { ShoppingCart, Home, PartyPopper, Heart, Car, MoreHorizontal } from 'lucide-react';

interface CategoryIconProps {
  category: string;
}

export function CategoryIcon({ category }: CategoryIconProps) {
  const getIcon = () => {
    switch (category) {
      case 'Alimentação':
        return <ShoppingCart className="text-green-600" size={24} />;
      case 'Casa':
        return <Home className="text-blue-600" size={24} />;
      case 'Lazer':
        return <PartyPopper className="text-purple-600" size={24} />;
      case 'Saúde':
        return <Heart className="text-red-600" size={24} />;
      case 'Transporte':
        return <Car className="text-orange-600" size={24} />;
      default:
        return <MoreHorizontal className="text-gray-600" size={24} />;
    }
  };

  const getBgColor = () => {
    switch (category) {
      case 'Alimentação':
        return 'bg-green-100';
      case 'Casa':
        return 'bg-blue-100';
      case 'Lazer':
        return 'bg-purple-100';
      case 'Saúde':
        return 'bg-red-100';
      case 'Transporte':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className={`w-full h-full rounded-full flex items-center justify-center ${getBgColor()}`}>
      {getIcon()}
    </div>
  );
}
