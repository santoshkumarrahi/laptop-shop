import React from 'react';
import {
  Laptop,
  Speaker,
  Headphones,
  Keyboard,
  Mouse,
  Tv,
  Gamepad2,
  Gamepad,
  Printer,
  HardDrive,
  Cpu,
  Layers,
  Zap,
  BatteryCharging,
  ShoppingBag,
  Fan,
  Camera,
  Wifi,
  Cable,
  Radio,
  Package,
  Sparkles,
  Briefcase,
  Monitor,
  Folder
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string | null;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-5 h-5' }) => {
  switch (iconName?.toLowerCase()) {
    case 'laptop':
      return <Laptop className={className} />;
    case 'gamepad2':
    case 'gaming':
      return <Gamepad2 className={className} />;
    case 'briefcase':
    case 'business':
      return <Briefcase className={className} />;
    case 'sparkles':
    case 'refurbished':
      return <Sparkles className={className} />;
    case 'monitor':
    case 'desktop':
      return <Monitor className={className} />;
    case 'package':
      return <Package className={className} />;
    case 'speaker':
    case 'speakers':
    case 'audio':
      return <Speaker className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'keyboard':
      return <Keyboard className={className} />;
    case 'mouse':
      return <Mouse className={className} />;
    case 'tv':
    case 'display':
      return <Tv className={className} />;
    case 'gamepad':
      return <Gamepad className={className} />;
    case 'printer':
      return <Printer className={className} />;
    case 'harddrive':
    case 'storage':
    case 'ssd':
      return <HardDrive className={className} />;
    case 'cpu':
    case 'ram':
      return <Cpu className={className} />;
    case 'layers':
    case 'gpu':
      return <Layers className={className} />;
    case 'zap':
    case 'charger':
      return <Zap className={className} />;
    case 'batterycharging':
    case 'battery':
      return <BatteryCharging className={className} />;
    case 'shoppingbag':
    case 'bag':
      return <ShoppingBag className={className} />;
    case 'fan':
    case 'cooling':
      return <Fan className={className} />;
    case 'camera':
    case 'webcam':
      return <Camera className={className} />;
    case 'wifi':
    case 'networking':
      return <Wifi className={className} />;
    case 'cable':
      return <Cable className={className} />;
    case 'radio':
      return <Radio className={className} />;
    default:
      return <Folder className={className} />;
  }
};
