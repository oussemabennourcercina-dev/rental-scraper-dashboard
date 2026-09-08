"use client";

import { useEffect, useState, useCallback } from "react";

interface Listing {
  source_id: string;
  title: string;
  price: number | null;
  price_raw: string | null;
  warm_rent: number | null;
  city: string | null;
  zip_code: string | null;
  rooms: number | null;
  size_m2: number | null;
  floor_number: number | null;
  deposit: string | null;
  utilities: number | null;
  url: string;
  first_seen_at: string;
  posted_at: string | null;
  images: string[];
  phone: string | null;
  balcony: boolean;
  terrace: boolean;
  garden: boolean;
  cellar: boolean;
  furnished: boolean;
  pets_allowed: boolean;
  heating_type: string | null;
  available_from: string | null;
  property_type: string | null;
  seller_name: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function Badge({ label, color = "zinc" }: { label: string; color?: "emerald" | "blue" | "amber" | "zinc" }) {
  const colors = {
    emerald: "bg-emerald-950 text-emerald-400 border-emerald-800",
    blue:    "bg-blue-950 text-blue-400 border-blue-800",
    amber:   "bg-amber-950 text-amber-400 border-amber-800",
    zinc:    "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>{label}</span>
  );
}

function PhoneButton({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);
  const digits = phone.replace(/\D/g, "");
  const wa = `https://wa.me/${digits.startsWith("0") ? "49" + digits.slice(1) : digits}`;

  return (
    <div className="flex items-center gap-2 mt-2">
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs rounded-lg hover:bg-emerald-900 transition-colors font-mono"
      >
        📞 {phone}
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg hover:bg-zinc-700 transition-colors"
        title="WhatsApp"
      >
        WhatsApp ↗
      </a>
      <button
        onClick={() => { navigator.clipboard.writeText(phone); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg hover:bg-zinc-700 transition-colors"
      >
        {copied ? "✓" : "Copier"}
      </button>
    </div>
  );
}

function fixImgUrl(url: string) {
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function ListingCard({ l }: { l: Listing }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = (Array.isArray(l.images) ? l.images : []).map(fixImgUrl);
  const hasPhone = l.phone && l.phone !== "N/A";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden flex flex-col hover:border-zinc-600 transition-colors">
      {/* Image */}
      <div className="relative h-44 bg-zinc-800 flex-shrink-0">
        {imgs.length > 0 ? (
          <>
            <img
              src={imgs[imgIdx]}
              alt={l.title ?? ""}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {imgs.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                {imgIdx > 0 && (
                  <button onClick={() => setImgIdx(i => i - 1)}
                    className="w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">‹</button>
                )}
                {imgIdx < imgs.length - 1 && (
                  <button onClick={() => setImgIdx(i => i + 1)}
                    className="w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">›</button>
                )}
              </div>
            )}
            <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
              {imgs.length} photo{imgs.length > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">Pas de photo</div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          {l.price_raw ? (
            <span className="bg-zinc-900/90 border border-zinc-700 text-emerald-400 font-bold text-sm px-2 py-1 rounded-lg">
              {l.price_raw}
            </span>
          ) : (
            <span className="bg-zinc-900/90 border border-zinc-700 text-zinc-500 text-sm px-2 py-1 rounded-lg">VB</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug">{l.title ?? "—"}</h3>

        {/* Location */}
        <p className="text-zinc-400 text-xs">
          📍 {l.zip_code ? `${l.zip_code} ` : ""}{l.city ?? "—"}
        </p>

        {/* Key stats */}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
          {l.rooms    && <span>🏠 {l.rooms} pièce{l.rooms > 1 ? "s" : ""}</span>}
          {l.size_m2  && <span>📐 {l.size_m2} m²</span>}
          {l.floor_number !== null && l.floor_number !== undefined && <span>🏢 Étage {l.floor_number}</span>}
          {l.warm_rent && <span className="text-amber-400">🌡 {l.warm_rent}€ cc</span>}
        </div>

        {/* Extras */}
        {l.deposit && (
          <p className="text-xs text-zinc-500">Caution : <span className="text-zinc-300">{l.deposit}</span></p>
        )}
        {l.available_from && (
          <p className="text-xs text-zinc-500">Dispo : <span className="text-zinc-300">{l.available_from}</span></p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {l.balcony    && <Badge label="Balcon"   color="blue" />}
          {l.terrace    && <Badge label="Terrasse" color="blue" />}
          {l.garden     && <Badge label="Jardin"   color="emerald" />}
          {l.furnished  && <Badge label="Meublé"   color="amber" />}
          {l.cellar     && <Badge label="Cave"     color="zinc" />}
          {l.pets_allowed && <Badge label="Animaux" color="zinc" />}
        </div>

        {/* Phone */}
        {hasPhone ? (
          <PhoneButton phone={l.phone!} />
        ) : (
          <p className="text-xs text-zinc-600 mt-1 italic">
            {l.phone === "N/A" ? "Pas de téléphone sur KA" : "Téléphone non encore extrait"}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">Scrappé {fmtDate(l.first_seen_at)}</span>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Voir sur KA ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  const [city,      setCity]      = useState("");
  const [minPrice,  setMinPrice]  = useState("");
  const [maxPrice,  setMaxPrice]  = useState("");
  const [rooms,     setRooms]     = useState("");
  const [hasPhone,  setHasPhone]  = useState(false);
  const [hasPhoto,  setHasPhoto]  = useState(false);
  const [balcony,   setBalcony]   = useState(false);
  const [furnished, setFurnished] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (city)     params.set("city",     city);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (rooms)    params.set("rooms",    rooms);
    if (hasPhone) params.set("hasPhone", "1");
    if (hasPhoto) params.set("hasPhoto", "1");
    if (balcony)  params.set("balcony",  "1");
    if (furnished) params.set("furnished", "1");

    const res  = await fetch(`/api/listings?${params}`);
    const data = await res.json();
    setListings(data.listings ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, city, minPrice, maxPrice, rooms, hasPhone, hasPhoto, balcony, furnished]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Annonces</h1>
        <p className="text-zinc-400 text-sm mt-0.5">{total.toLocaleString("fr-FR")} annonces trouvées</p>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Ville / CP</label>
            <input value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Berlin, 10115..." onBlur={() => setPage(1)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Prix min (€)</label>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
              placeholder="500"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Prix max (€)</label>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="1500"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Pièces min</label>
            <select value={rooms} onChange={(e) => setRooms(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-zinc-500">
              <option value="">Toutes</option>
              {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}+</option>)}
            </select>
          </div>
          <button type="submit"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm transition-colors font-medium">
            Filtrer
          </button>
          <button type="button"
            onClick={() => { setCity(""); setMinPrice(""); setMaxPrice(""); setRooms(""); setHasPhone(false); setHasPhoto(false); setBalcony(false); setFurnished(false); setPage(1); }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-400 transition-colors">
            Reset
          </button>
        </div>
        {/* Toggle filters */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "📞 Avec téléphone", val: hasPhone, set: setHasPhone },
            { label: "📷 Avec photos",    val: hasPhoto, set: setHasPhoto },
            { label: "🏠 Balcon",         val: balcony,  set: setBalcony },
            { label: "🛋 Meublé",         val: furnished, set: setFurnished },
          ].map(({ label, val, set }) => (
            <button key={label} type="button"
              onClick={() => { set(!val); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                val ? "bg-blue-900 border-blue-700 text-blue-300" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-zinc-500 text-sm">Chargement...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">Aucune annonce trouvée</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => <ListingCard key={l.source_id} l={l} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm disabled:opacity-40 hover:bg-zinc-800 transition-colors">
            ← Préc
          </button>
          <span className="text-sm text-zinc-500 px-2">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm disabled:opacity-40 hover:bg-zinc-800 transition-colors">
            Suiv →
          </button>
        </div>
      )}
    </div>
  );
}