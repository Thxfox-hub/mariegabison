/**
 * Static landing page content from the wedding-jewelry-landing-page design.
 * Images are the exact Pexels URLs used in the source project.
 */

export const carouselPieces = [
  {
    id: "collier-silence",
    name: "Collier Silence",
    category: "Collier",
    description:
      "Un collier d'une pureté absolue, dessiné comme une ligne de lumière sur la peau. Pièce unique de la collection One Day Only, destinée aux femmes qui choisissent l'essentiel.",
    details: [
      "Or jaune 18 carats",
      "Mailles fines artisanales",
      "Fermoir signature Marie Gabison",
      "Modèle unique",
    ],
    material: "Or jaune 18 carats",
    price: "Sur demande",
    edition: "Modèle unique",
    available: true,
    image: "/carousel/collier-silence.jpeg",
  },
  {
    id: "boucles-nocturne",
    name: "Boucles Nocturne",
    category: "Boucles d'oreilles",
    description:
      "Des boucles d'oreilles qui capturent la lumière avec une discrétion haute joaillerie. Un équilibre rare entre présence et retenue, pensé pour traverser les saisons.",
    details: [
      "Or blanc 18 carats",
      "Diamants sélectionnés",
      "Fermoir sécurisé",
      "Édition limitée",
    ],
    material: "Or blanc & diamants",
    price: "Sur demande",
    edition: "Édition limitée",
    available: true,
    image: "/carousel/boucles-nocturne.jpeg",
  },
  {
    id: "manchette-absolue",
    name: "Manchette Absolue",
    category: "Manchette",
    description:
      "Une manchette architecturale, sculptée pour habiller le poignet d'une présence intemporelle. Une pièce de caractère, à porter seule ou en accumulation raffinée.",
    details: [
      "Or jaune 18 carats",
      "Forme sculpturale",
      "Finition polie miroir",
      "Modèle unique — sur-mesure possible à Paris",
    ],
    material: "Or jaune 18 carats",
    price: "Sur demande",
    edition: "Modèle unique",
    available: true,
    image: "/carousel/manchette-absolue.jpeg",
  },
];

export const maisonCollections = [
  {
    id: "one-day-only",
    name: "One Day Only",
    season: "Collection 2026",
    description:
      "La collection signature du moment. Colliers, boucles d'oreilles et manchettes en modèles uniques ou pièces signatures numérotées.",
    categories: ["Colliers", "Boucles d'oreilles", "Manchettes"],
  },
  {
    id: "heritage",
    name: "Héritage",
    season: "Depuis 1996",
    description:
      "L'esprit de la maison : des pièces intemporelles, exclusivement uniques, destinées pour se transmettre.",
    categories: ["Colliers", "Boucles d'oreilles", "Manchettes"],
  },
  {
    id: "sur-mesure",
    name: "Sur-Mesure",
    season: "Rendez-vous à Paris",
    description:
      "Une création entièrement privée, imaginée pour vous. Le sur-mesure nécessite un déplacement sur Paris uniquement.",
    categories: ["Colliers", "Boucles d'oreilles", "Manchettes"],
  },
];

export const categories = [
  {
    name: "Colliers",
    description: "Lignes de lumière pour le décolleté",
    href: "/?cat=Collier",
  },
  {
    name: "Boucles d'oreilles",
    description: "Éclats discrets et présence couture",
    href: "/?cat=Boucles%20d'oreille",
  },
  {
    name: "Manchettes",
    description: "Sculptures pour le poignet",
    href: "/?cat=Bracelet",
  },
];
