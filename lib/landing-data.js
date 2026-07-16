/**
 * Static landing page content from the wedding-jewelry-landing-page design.
 * Images are the exact Pexels URLs used in the source project.
 */

export const carouselPieces = [
  {
    id: "collier-it-had-to-be-you",
    name: "Collier It Had To Be You",
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
    id: "collier-lumiere",
    name: "Collier Lumière",
    category: "Collier",
    description:
      "Un collier qui capture la lumière avec une discrétion haute joaillerie. Un équilibre rare entre présence et retenue, pensé pour traverser les saisons. Pièce de la collection One Day Only.",
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
    id: "collier-grace",
    name: "Collier Grâce",
    category: "Collier",
    description:
      "Un collier d'élégance absolue, sculpté pour sublimer le décolleté d'une présence intemporelle. Une pièce de caractère de la collection One Day Only.",
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
    image: "/carousel/bracelet-absolue.jpeg",
  },
];

export const maisonCollections = [
  {
    id: "one-day-only",
    name: "One Day Only",
    season: "Collection 2026",
    description:
      "La collection signature du moment. Colliers, boucles d'oreilles et manchettes en modèles uniques ou pièces signatures numérotées.",
    categories: ["Colliers", "Boucles d'oreilles", "Bracelets"],
  },
  {
    id: "heritage",
    name: "Héritage",
    season: "Depuis 1996",
    description:
      "L'esprit de la maison : des pièces intemporelles, exclusivement uniques, destinées pour se transmettre.",
    categories: ["Colliers", "Boucles d'oreilles", "Bracelets"],
  },
  {
    id: "sur-mesure",
    name: "Sur-Mesure",
    season: "Rendez-vous à Paris",
    description:
      "Une création entièrement privée, imaginée pour vous. Le sur-mesure nécessite un déplacement sur Paris uniquement.",
    categories: ["Colliers", "Boucles d'oreilles", "Bracelets"],
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
    name: "Bracelets",
    description: "Sculptures pour le poignet",
    href: "/?cat=Bracelet",
  },
];
