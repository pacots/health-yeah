import {
  AlertTriangle,
  Pill,
  Heart,
  FileText,
  Plus,
  Trash2,
  Copy,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Stethoscope,
  Calendar,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export const Icons = {
  AlertTriangle,
  Pill,
  Heart,
  FileText,
  Plus,
  Trash2,
  Copy,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Phone,
  Stethoscope,
  Calendar,
  ChevronRight,
  Menu,
  X,
};

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  color?: string;
  className?: string;
}

export function Icon({ name, size = 24, color = "currentColor", className = "" }: IconProps) {
  const IconComponent = Icons[name];
  return <IconComponent size={size} color={color} className={className} />;
}
