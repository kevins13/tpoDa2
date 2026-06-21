import { articlesService } from './src/modulos/articulos/articulos.service';

async function test() {
  try {
    const result = await articlesService.submitArticle({
      userId: 3,
      descripcionCatalogo: "Test",
      descripcionCompleta: "Test desc",
    });
    console.log("Success:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
