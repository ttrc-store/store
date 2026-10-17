# TTRC Store — Typo-Tolerant Technical Search Implementation Report

**Release**: Next Release (Customer Experience Improvements)  
**Authoritative Database**: MongoDB Atlas (`ttrc_store`)  
**Status**: Implemented, Verified, Zero Synthetic Data  

---

## 1. Executive Summary

Search queries in robotics and electronics stores are highly specialized. Customers search by exact part numbers (`TB6612FNG`, `SG90`, `MPU6050`, `ESP32-WROOM-32`), specifications (`5V`, `12V DC`, `3S LiPo`), or colloquial names. Furthermore, mobile typing frequently produces domain-specific typos (`ardunio` instead of `arduino`, `sesnor` instead of `sensor`, `moter` instead of `motor`, `chasis` instead of `chassis`).

A generic database text query or naive substring search fails to return relevant products, causing bounce and abandoned intent.

We have engineered a two-tier, domain-aware technical search engine:
1. **Domain-Specific Robotics Spelling & Typo Correction Dictionary**.
2. **Multi-field Technical Search with Relevance Scoring and Multi-Attribute Filtering**.
3. **Atlas Search Configuration Guide** for zero-downtime transition to MongoDB Atlas Lucene Search without code churn.

---

## 2. Robotics Typo Tolerance & Term Expansion

In [catalog.ts](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/lib/mongodb/catalog.ts), `searchStoreProducts` incorporates a comprehensive domain normalization dictionary:

```typescript
const ROBOTICS_TYPO_DICTIONARY: Record<string, string[]> = {
  arduino: ['ardunio', 'arduno', 'ardunioo', 'ardinao'],
  raspberry: ['rasberry', 'raspbian', 'rasberi', 'raspi'],
  sensor: ['sesnor', 'senser', 'sensr', 'snosor'],
  motor: ['moter', 'motoer', 'motr', 'motot'],
  chassis: ['chasis', 'chassi', 'chasiss', 'chasi'],
  battery: ['battry', 'batry', 'batery', 'batterie'],
  ultrasonic: ['ultrasonc', 'ultrasonicc', 'ultrasoic', 'ultrasonic'],
  soldering: ['solder', 'soldring', 'sodering'],
  driver: ['drivr', 'drive', 'dirver'],
  connector: ['conector', 'connctor', 'conecter'],
  tb6612fng: ['tb6612', 'tb6612f', 'tb6612fn'],
  l298n: ['l298', 'l298d', 'l298motor'],
  sg90: ['sg-90', 'sg 90', 'servo90'],
  mg996r: ['mg996', 'mg-996', 'mg996servo'],
  mpu6050: ['mpu-6050', 'mpu 6050', 'gy521', 'gy-521'],
  bldc: ['brushless', 'bldcmotor'],
  stepper: ['steper', 'stepmotor', 'stepr'],
  fastener: ['screw', 'bolt', 'nut', 'fastner'],
  standoff: ['stand off', 'spacer', 'stud'],
};
```

### Normalization Process
1. Query strings are stripped of regex-injection tokens and split into whitespace-delimited tokens.
2. Each token is evaluated against both direct canonical terms and reverse typo lookup maps.
3. Expanded candidate stems are compiled into token match lists, ensuring queries like `"ardunio sesnor"` accurately match products tagged with `"Arduino Sensor"`.

---

## 3. Multi-Field Coverage & Technical Attribute Matching

The search engine queries across all high-relevance product fields simultaneously:
- **Identifier Fields**: `name`, `sku`, `slug`, `part_number`, `model_number`.
- **Engineering Fields**: `voltage`, `material`, `brand`, `short_description`.
- **Nested Technical Specs**: `technical_specs.key`, `technical_specs.value`.
- **In-Box Package Contents**: `in_box_items.item_name`.

### Relevance Scoring Algorithm
When multiple items match, they are ranked deterministically:
- **Exact SKU match**: +100 points
- **Exact product name match**: +90 points
- **All query tokens present**: +25 points
- **SKU substring match**: +20 points
- **Name starts with query**: +15 points
- **Part/model number exact match**: +15 points
- **In-stock inventory availability**: +5 points (promotes purchasable items)

---

## 4. Technical Attribute Filtering

The catalog and search bar interface in [catalog-filter-bar.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/components/store/catalog-filter-bar.tsx) and [page.tsx](file:///c:/Users/ELCOT/Desktop/ttrc-store/apps/web/src/app/search/page.tsx) exposes real robotics filter facets:
- **Operating Voltage**: `3.3V`, `5V`, `7-12V DC`, `12V`.
- **Product Type**: `Kits`, `Spare Parts`, `Standard Components`.
- **Stock Availability**: In Stock Only toggle.
- **Brand & Pricing Rails**: Min/Max price in Indian Rupees (INR).

---

## 5. MongoDB Atlas Search Configuration Guide

While regex search provides immediate query execution with zero database dependencies, MongoDB Atlas Lucene Search offers sub-millisecond full-text performance at high scale.

To enable Atlas Search without modifying application code:

1. Log in to the **MongoDB Atlas Console**.
2. Navigate to **Database Deployments** > **Browse Collections** > Select database `ttrc_store` > Select collection `products`.
3. Select the **Atlas Search** tab > Click **Create Search Index**.
4. Choose **JSON Editor** and name the index `default`.
5. Paste the following index definition:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "string",
        "analyzer": "lucene.standard",
        "multi": {
          "fuzzy": {
            "type": "string",
            "analyzer": "lucene.simple"
          }
        }
      },
      "sku": {
        "type": "string",
        "analyzer": "lucene.keyword"
      },
      "part_number": {
        "type": "string",
        "analyzer": "lucene.keyword"
      },
      "brand": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "voltage": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "short_description": {
        "type": "string",
        "analyzer": "lucene.english"
      },
      "technical_specs": {
        "type": "document",
        "fields": {
          "key": { "type": "string" },
          "value": { "type": "string" }
        }
      }
    }
  }
}
```

6. Click **Save Index**. Atlas will index the collection in the background.
7. The application automatically falls back to regex search if Atlas Search is disabled or during local development, guaranteeing zero operational downtime.

---

## 6. Security & Performance Invariants

- **Regex Injection Prevention**: All search terms are sanitized with `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before constructing MongoDB `$regex` expressions.
- **Debounced Storefront Requests**: Autocomplete and search inputs debounce input at 300ms, protecting API endpoints from request flooding.
- **Published Only Guard**: Queries strictly enforce `{ is_active: true }`, ensuring draft or unpublished products are never leaked to customers.
