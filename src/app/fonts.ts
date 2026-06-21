import { Syne, DM_Sans } from "next/font/google";

export const syne = Syne({
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-syne",
});

export const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-dm-sans",
});
