import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AVATAR_OPTIONS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zara",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aria",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kai",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rhea",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Vik",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Tara",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rey",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kira",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jules",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ishan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Diya",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zane",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sia",
];
