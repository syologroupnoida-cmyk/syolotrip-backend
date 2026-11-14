import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

// GET /hotels
router.get('/', async (req, res) => {
  try {
    const { city, star_rating, max_price, property_type } = req.query;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const offset = (page - 1) * limit;

    let conditions: string[] = ["is_active = true", "publication_status = 'APPROVED'"];
    let values: any[] = [];
    let idx = 1;

    if (city) {
      const cleanCity = (city as string).split(',')[0].split('(')[0].trim();
      conditions.push(`(LOWER(city) LIKE LOWER($${idx}) OR LOWER(name) LIKE LOWER($${idx}) OR LOWER(country) LIKE LOWER($${idx}))`);
      values.push(`%${cleanCity}%`);
      idx++;
    }
    if (star_rating) {
      conditions.push(`star_rating >= $${idx}`);
      values.push(parseInt(star_rating as string, 10));
      idx++;
    }
    if (max_price) {
      conditions.push(`starting_price <= $${idx}`);
      values.push(parseFloat(max_price as string));
      idx++;
    }
    if (property_type) {
      conditions.push(`LOWER(property_type) = LOWER($${idx})`);
      values.push(property_type);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query(`SELECT COUNT(*) as total FROM hotels ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const queryStr = `
      SELECT * FROM hotels
      ${whereClause}
      ORDER BY starting_price ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const result = await query(queryStr, [...values, limit, offset]);

    const rows = result.rows;
    const finalTotal = total;

    // Fetch rooms for these hotels
    const hotelIds = rows.map((h) => h.id);
    let roomsByHotel: Record<string, any[]> = {};
    if (hotelIds.length > 0) {
      const roomsRes = await query(
        `SELECT * FROM hotel_rooms WHERE hotel_id = ANY($1::uuid[]) AND is_available = true`,
        [hotelIds]
      );
      roomsRes.rows.forEach((r) => {
        if (!roomsByHotel[r.hotel_id]) roomsByHotel[r.hotel_id] = [];
        roomsByHotel[r.hotel_id].push({
          id: r.id,
          room_type: r.room_type,
          bed_type: r.bed_type,
          max_occupancy: r.max_occupancy,
          price_per_night: parseFloat(r.price_per_night),
          taxes_per_night: parseFloat(r.taxes_per_night || '0'),
          available_rooms: r.available_rooms,
          amenities: r.amenities,
          images: r.images,
          is_available: r.is_available,
        });
      });
    }

    const items = rows.map((row) => ({
      id: row.id,
      name: row.name,
      property_type: row.property_type,
      partner_id: row.partner_id,
      publication_status: row.publication_status,
      star_rating: row.star_rating,
      guest_rating: row.guest_rating,
      rating_label: row.rating_label,
      review_count: row.review_count,
      address: row.address,
      city: row.city,
      country: row.country,
      neighborhood: row.neighborhood,
      latitude: row.latitude,
      longitude: row.longitude,
      overview: row.overview,
      amenities: row.amenities,
      tags: row.tags,
      featured_image: row.featured_image,
      images: row.images,
      starting_price: parseFloat(row.starting_price),
      currency: row.currency,
      featured: row.featured,
      is_simulated: row.is_simulated,
      rooms: roomsByHotel[row.id] || [],
    }));

    return res.json({
      success: true,
      inventory_status: items.length > 0 ? 'AVAILABLE' : 'NO_INVENTORY',
      message:
        items.length > 0
          ? 'Hotels retrieved successfully'
          : `No hotels currently available in ${city || 'this location'}. Try adjusting your dates or explore our verified luxury stays.`,
      data: {
        items,
        pagination: {
          total: finalTotal,
          page,
          limit,
          pages: Math.ceil(finalTotal / limit) || 1,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /hotels/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM hotels WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    const row = result.rows[0];

    const roomsRes = await query('SELECT * FROM hotel_rooms WHERE hotel_id = $1', [row.id]);
    const rooms = roomsRes.rows.map((r) => ({
      id: r.id,
      room_type: r.room_type,
      bed_type: r.bed_type,
      max_occupancy: r.max_occupancy,
      price_per_night: parseFloat(r.price_per_night),
      taxes_per_night: parseFloat(r.taxes_per_night || '0'),
      available_rooms: r.available_rooms,
      amenities: r.amenities,
      images: r.images,
      is_available: r.is_available,
    }));

    return res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        property_type: row.property_type,
        partner_id: row.partner_id,
        publication_status: row.publication_status,
        star_rating: row.star_rating,
        guest_rating: row.guest_rating,
        rating_label: row.rating_label,
        review_count: row.review_count,
        address: row.address,
        city: row.city,
        country: row.country,
        neighborhood: row.neighborhood,
        latitude: row.latitude,
        longitude: row.longitude,
        overview: row.overview,
        amenities: row.amenities,
        tags: row.tags,
        featured_image: row.featured_image,
        images: row.images,
        starting_price: parseFloat(row.starting_price),
        currency: row.currency,
        featured: row.featured,
        is_simulated: row.is_simulated,
        rooms,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

