/**
 * Marcas para el editor visual del panel. El sitio público las ignora; en la
 * vista previa del editor se muestran botones sobre cada elemento marcado.
 *
 * Destinos:
 *   text:<llave>      texto del diccionario (p. ej. text:about.title)
 *   slide:<id>        textos de un slide del carrusel (con partes line1, line2…)
 *   slideimg:<id>     imagen de fondo de un slide
 *   tour:<id>         nombre y descripción corta de un tour
 *   tourimg:<id>      portada de un tour
 *   price:<id>        precio de un tour
 *   gal:<id>          foto de la galería
 *   guide:<id>        guía del equipo
 *   rev:<id>          testimonio
 *   faq:<id>          pregunta frecuente
 *   about:main|secondary  fotos de «Somos de aquí»
 *   settings          datos de contacto
 */
export type EditKind = "text" | "image" | "price";

export const ed = (target: string, kind: EditKind = "text") => ({ "data-edit": target, "data-edit-kind": kind });

export const part = (target: string, name: string) => ({ "data-part-of": target, "data-part": name });
