-- ============================================================
-- Wine Tracker — Supabase / Postgres 15 Schema
-- Run this against your Supabase project SQL editor
-- ============================================================

-- --------------- ENUMS ---------------

CREATE TYPE clarity_enum AS ENUM ('clear', 'hazy');
CREATE TYPE appearance_intensity_enum AS ENUM ('pale', 'medium', 'deep');
CREATE TYPE color_enum AS ENUM (
  'water-white','lemon-green','lemon','gold','amber','brown',
  'pink','salmon','orange',
  'purple','ruby','garnet','tawny'
);
CREATE TYPE condition_enum AS ENUM ('clean', 'faulty');
CREATE TYPE nose_intensity_enum AS ENUM ('light', 'medium', 'pronounced');
CREATE TYPE development_enum AS ENUM ('youthful', 'developing', 'mature', 'tired');
CREATE TYPE sweetness_enum AS ENUM ('dry','off-dry','medium-dry','medium-sweet','sweet','luscious');
CREATE TYPE acidity_enum AS ENUM ('low','medium-minus','medium','medium-plus','high');
CREATE TYPE tannin_level_enum AS ENUM ('low','medium-minus','medium','medium-plus','high');
CREATE TYPE tannin_texture_enum AS ENUM ('grippy', 'smooth');
CREATE TYPE alcohol_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE body_enum AS ENUM ('light','medium-minus','medium','medium-plus','full');
CREATE TYPE mousse_enum AS ENUM ('delicate', 'creamy', 'aggressive');
CREATE TYPE flavour_intensity_enum AS ENUM ('light', 'medium', 'pronounced');
CREATE TYPE finish_enum AS ENUM ('short', 'medium', 'long');
CREATE TYPE quality_enum AS ENUM ('faulty','poor','acceptable','good','very-good','outstanding');
CREATE TYPE readiness_enum AS ENUM ('too-young','can-drink-has-potential','drink-now','too-old');
CREATE TYPE wine_type_enum AS ENUM ('red','white','rosé','orange','sparkling','fortified','dessert');
CREATE TYPE cellar_status_enum AS ENUM ('tried','want-to-try','in-my-cellar');
CREATE TYPE aroma_category_enum AS ENUM ('primary','secondary','tertiary');

-- --------------- TABLES ---------------

CREATE TABLE wines (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  wine_name                TEXT NOT NULL,
  producer                 TEXT,
  region                   TEXT,
  appellation              TEXT,
  varietal                 TEXT[],
  vintage                  SMALLINT CHECK (vintage BETWEEN 1900 AND 2100),
  wine_type                wine_type_enum NOT NULL,
  date_tasted              DATE NOT NULL DEFAULT CURRENT_DATE,
  occasion_notes           TEXT,
  bottle_photo_url         TEXT,
  vivino_url               TEXT,

  price_paid               NUMERIC(8,2),
  retail_price             NUMERIC(8,2),
  overall_rating           SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  value_score              NUMERIC(6,4) GENERATED ALWAYS AS (
                             CASE WHEN price_paid IS NOT NULL AND price_paid > 0
                             THEN ROUND(CAST(overall_rating AS NUMERIC) / price_paid, 4)
                             ELSE NULL END
                           ) STORED,
  deal_delta               NUMERIC(8,2) GENERATED ALWAYS AS (
                             CASE WHEN retail_price IS NOT NULL AND price_paid IS NOT NULL
                             THEN retail_price - price_paid
                             ELSE NULL END
                           ) STORED,
  cellar_status            cellar_status_enum NOT NULL DEFAULT 'tried',

  -- Appearance
  appearance_clarity       clarity_enum,
  appearance_intensity     appearance_intensity_enum,
  appearance_color         color_enum,

  -- Nose
  nose_condition           condition_enum,
  nose_intensity           nose_intensity_enum,
  nose_development         development_enum,

  -- Palate
  palate_sweetness         sweetness_enum,
  palate_acidity           acidity_enum,
  palate_tannin_level      tannin_level_enum,
  palate_tannin_texture    tannin_texture_enum,
  palate_alcohol           alcohol_enum,
  palate_body              body_enum,
  palate_mousse            mousse_enum,
  palate_flavour_intensity flavour_intensity_enum,
  palate_finish            finish_enum,

  -- Conclusions
  conclusion_quality       quality_enum,
  conclusion_readiness     readiness_enum,

  -- Offline sync
  client_id                UUID,
  sync_status              TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced','pending','conflict'))
);

CREATE TABLE aroma_tags (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  category_hint  aroma_category_enum NOT NULL,
  parent_id      UUID REFERENCES aroma_tags(id),
  display_order  SMALLINT NOT NULL DEFAULT 0,
  is_custom      BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE wine_aromas (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id  UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES aroma_tags(id),
  context  TEXT NOT NULL CHECK (context IN ('nose','palate')),
  category aroma_category_enum NOT NULL,
  UNIQUE (wine_id, tag_id, context)
);

CREATE TABLE varietals (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE,
  color wine_type_enum
);

-- --------------- INDEXES ---------------

CREATE INDEX idx_wines_wine_type       ON wines(wine_type);
CREATE INDEX idx_wines_price_paid      ON wines(price_paid);
CREATE INDEX idx_wines_overall_rating  ON wines(overall_rating);
CREATE INDEX idx_wines_value_score     ON wines(value_score);
CREATE INDEX idx_wines_date_tasted     ON wines(date_tasted DESC);
CREATE INDEX idx_wines_cellar_status   ON wines(cellar_status);
CREATE INDEX idx_wines_vintage         ON wines(vintage);
CREATE INDEX idx_wines_palate_acidity  ON wines(palate_acidity);
CREATE INDEX idx_wines_palate_sweetness ON wines(palate_sweetness);
CREATE INDEX idx_wines_palate_body     ON wines(palate_body);
CREATE INDEX idx_wines_conclusion_quality ON wines(conclusion_quality);
CREATE INDEX idx_wine_aromas_wine_id   ON wine_aromas(wine_id);
CREATE INDEX idx_wine_aromas_tag_id    ON wine_aromas(tag_id);
CREATE INDEX idx_wine_aromas_context   ON wine_aromas(context);
CREATE INDEX idx_wines_fts             ON wines USING gin(
  to_tsvector('english', coalesce(wine_name,'') || ' ' || coalesce(producer,'') || ' ' || coalesce(occasion_notes,''))
);
CREATE INDEX idx_wines_varietal        ON wines USING gin(varietal);

-- --------------- TRIGGER: updated_at ---------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------------- AROMA TAG SEED DATA ---------------

-- Primary: Floral
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('floral',          'primary', 10),
  ('acacia',          'primary', 11),
  ('rose',            'primary', 12),
  ('violet',          'primary', 13),
  ('elderflower',     'primary', 14);

-- Primary: Green / Herbaceous
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('herbaceous',      'primary', 20),
  ('grass',           'primary', 21),
  ('capsicum',        'primary', 22),
  ('asparagus',       'primary', 23),
  ('eucalyptus',      'primary', 24),
  ('mint',            'primary', 25);

-- Primary: Red Fruit
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('red fruit',       'primary', 30),
  ('cherry',          'primary', 31),
  ('raspberry',       'primary', 32),
  ('strawberry',      'primary', 33),
  ('cranberry',       'primary', 34),
  ('redcurrant',      'primary', 35);

-- Primary: Black Fruit
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('black fruit',     'primary', 40),
  ('blackcurrant',    'primary', 41),
  ('blackberry',      'primary', 42),
  ('blueberry',       'primary', 43),
  ('black cherry',    'primary', 44);

-- Primary: Stone Fruit
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('stone fruit',     'primary', 50),
  ('peach',           'primary', 51),
  ('apricot',         'primary', 52),
  ('nectarine',       'primary', 53),
  ('plum',            'primary', 54);

-- Primary: Tropical
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('tropical',        'primary', 60),
  ('mango',           'primary', 61),
  ('pineapple',       'primary', 62),
  ('lychee',          'primary', 63),
  ('banana',          'primary', 64),
  ('passion fruit',   'primary', 65),
  ('melon',           'primary', 66);

-- Primary: Citrus
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('citrus',          'primary', 70),
  ('lemon',           'primary', 71),
  ('lime',            'primary', 72),
  ('grapefruit',      'primary', 73),
  ('orange peel',     'primary', 74);

-- Primary: Dried / Cooked Fruit
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('dried fruit',     'primary', 80),
  ('fig',             'primary', 81),
  ('raisin',          'primary', 82),
  ('prune',           'primary', 83),
  ('jam',             'primary', 84);

-- Primary: Spice / Mineral
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('black pepper',    'primary', 90),
  ('white pepper',    'primary', 91),
  ('liquorice',       'primary', 92),
  ('flint',           'primary', 93),
  ('wet stone',       'primary', 94),
  ('chalk',           'primary', 95),
  ('slate',           'primary', 96);

-- Secondary: Yeast
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('bread',           'secondary', 100),
  ('biscuit',         'secondary', 101),
  ('brioche',         'secondary', 102),
  ('toast',           'secondary', 103),
  ('cheese',          'secondary', 104),
  ('yoghurt',         'secondary', 105);

-- Secondary: Malolactic
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('butter',          'secondary', 110),
  ('cream',           'secondary', 111),
  ('butterscotch',    'secondary', 112);

-- Secondary: Oak
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('vanilla',         'secondary', 120),
  ('coconut',         'secondary', 121),
  ('clove',           'secondary', 122),
  ('cedar',           'secondary', 123),
  ('charred wood',    'secondary', 124),
  ('smoke',           'secondary', 125),
  ('chocolate',       'secondary', 126),
  ('coffee',          'secondary', 127);

-- Tertiary
INSERT INTO aroma_tags (name, category_hint, display_order) VALUES
  ('dried apricot',   'tertiary', 200),
  ('marmalade',       'tertiary', 201),
  ('fruit cake',      'tertiary', 202),
  ('mushroom',        'tertiary', 210),
  ('forest floor',    'tertiary', 211),
  ('leather',         'tertiary', 212),
  ('game',            'tertiary', 213),
  ('truffle',         'tertiary', 214),
  ('soy',             'tertiary', 220),
  ('marmite',         'tertiary', 221),
  ('almond',          'tertiary', 230),
  ('marzipan',        'tertiary', 231),
  ('hazelnut',        'tertiary', 232),
  ('toffee',          'tertiary', 233),
  ('caramel',         'tertiary', 234),
  ('nail polish',     'tertiary', 240),
  ('vinegar',         'tertiary', 241);

-- --------------- VARIETAL SEED DATA ---------------

INSERT INTO varietals (name, color) VALUES
  ('Cabernet Sauvignon', 'red'),
  ('Merlot', 'red'),
  ('Pinot Noir', 'red'),
  ('Syrah', 'red'),
  ('Shiraz', 'red'),
  ('Grenache', 'red'),
  ('Malbec', 'red'),
  ('Tempranillo', 'red'),
  ('Sangiovese', 'red'),
  ('Nebbiolo', 'red'),
  ('Barbera', 'red'),
  ('Zinfandel', 'red'),
  ('Mourvèdre', 'red'),
  ('Carignan', 'red'),
  ('Gamay', 'red'),
  ('Cabernet Franc', 'red'),
  ('Petit Verdot', 'red'),
  ('Touriga Nacional', 'red'),
  ('Montepulciano', 'red'),
  ('Nero d''Avola', 'red'),
  ('Chardonnay', 'white'),
  ('Sauvignon Blanc', 'white'),
  ('Riesling', 'white'),
  ('Pinot Grigio', 'white'),
  ('Pinot Gris', 'white'),
  ('Gewürztraminer', 'white'),
  ('Viognier', 'white'),
  ('Albariño', 'white'),
  ('Chenin Blanc', 'white'),
  ('Roussanne', 'white'),
  ('Marsanne', 'white'),
  ('Vermentino', 'white'),
  ('Grüner Veltliner', 'white'),
  ('Muscat', 'white'),
  ('Torrontés', 'white'),
  ('Fiano', 'white'),
  ('Greco', 'white'),
  ('Verdicchio', 'white'),
  ('Garganega', 'white'),
  ('Trebbiano', 'white'),
  ('Grenache Blanc', 'white'),
  ('Semillon', 'white'),
  ('Melon de Bourgogne', 'white');
