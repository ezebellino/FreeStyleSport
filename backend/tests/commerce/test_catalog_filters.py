from types import SimpleNamespace

from app.modules.commerce.service import product_matches_catalog_filters


def product_with(
    category_slug: str,
    attributes: dict[str, object] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        category=SimpleNamespace(slug=category_slug),
        attributes=attributes or {},
    )


def test_legacy_combined_category_matches_category_and_audience_filters() -> None:
    product = product_with("hombre-calzados")

    assert product_matches_catalog_filters(product, category_slug="calzado")
    assert product_matches_catalog_filters(product, audience_slug="hombre")


def test_product_attributes_match_audience_filter() -> None:
    product = product_with("calzado", {"linea": "mujer"})

    assert product_matches_catalog_filters(product, category_slug="calzado", audience_slug="mujer")
    assert not product_matches_catalog_filters(
        product,
        category_slug="calzado",
        audience_slug="hombre",
    )
