import type { MetadataRoute } from "next";

/** Lets restaurants install the orders screen on a phone or tablet like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menuto Ordini",
    short_name: "Menuto",
    description: "Ricevi e gestisci gli ordini del tuo ristorante",
    start_url: "/dashboard/orders",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f5f5ef",
    theme_color: "#1c2017",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
