// Geometría del clásico cursor de mano (el mismo lenguaje que el "pointer"
// de Windows) — path base tomado de "Hand Cursor.svg" de Wikimedia Commons
// (dominio público, CC0: commons.wikimedia.org/wiki/File:Hand_Cursor.svg),
// recoloreado a la paleta del sitio en vez de blanco/negro, con sombra propia.
const PATH_MANO =
  'm 187.8491,1006.1164 c 0.56823,-19.41976 -2.98488,-46.86815 -3.03757,-47.29784 -36.32441,-19.18306 -24.81964,-113.71339 -70.708,-140.35023 l 0.003,0 c -8.46291,-3.16355 -13.23458,-7.77304 -13.23458,-13.00854 0,-8.28986 11.96316,-15.01018 26.72046,-15.01018 14.75732,0 22.55614,9.1261 27.29306,13.72371 11.47818,11.14065 19.87425,18.81089 29.92673,32.68962 l 0.0218,-26.34309 0.0429,-139.35893 c 0,-14.4573 9.60038,-26.09622 21.52564,-26.09622 11.92519,0 21.52565,11.63892 21.52565,26.09622 l 0,122.13393 -6.2e-4,-69.88562 c -1.3e-4,-14.45713 9.60031,-26.0959 21.52536,-26.0959 11.92504,0 21.52532,11.63889 21.52532,26.0959 l 0,65.52279 -7e-5,-35.50248 c -3e-5,-14.45713 9.60026,-26.0959 21.52535,-26.0959 11.92501,0 21.52536,11.63949 21.52536,26.0959 l 9.3e-4,48.2274 -10e-4,-20.02653 c -8.3e-4,-14.45713 8.42567,-26.09587 18.89165,-26.09587 10.46598,0 18.89188,11.64136 18.8917,26.09587 3.11037,54.49434 -2.84375,125.03673 -9.80705,156.95315 -0.36473,6.01496 -4.28744,13.88897 -4.50965,20.235 -0.50243,14.34876 -2.00299,39.20938 -1.99223,47.29784 z'

export function CursorManoIndice({ color, className }) {
  return (
    <svg viewBox="0 0 453.54331 453.54331" className={className} aria-hidden="true">
      <g transform="translate(0,-598.8189)">
        <path d={PATH_MANO} transform="translate(9,13)" fill="#000000" opacity="0.22" />
        <path
          d={PATH_MANO}
          fill={color}
          stroke="#1c1b19"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
