require('dotenv').config();
const mongoose = require('mongoose');
const Furniture = require('../models/Furniture');

const FURNITURE = [
  // Sofas
  { name: 'Lounge Sofa',         type: 'sofa',   modelUrl: '/models/loungeSofa.glb',            thumbnailUrl: '/thumbnails/loungeSofa_NE.png',            dimensions: { width: 2.0, depth: 0.9, height: 0.85 }, price: 799  },
  { name: 'Lounge Sofa Long',    type: 'sofa',   modelUrl: '/models/loungeSofaLong.glb',         thumbnailUrl: '/thumbnails/loungeSofaLong_NE.png',         dimensions: { width: 2.8, depth: 0.9, height: 0.85 }, price: 999  },
  { name: 'Lounge Sofa Corner',  type: 'sofa',   modelUrl: '/models/loungeSofaCorner.glb',       thumbnailUrl: '/thumbnails/loungeSofaCorner_NE.png',       dimensions: { width: 2.2, depth: 2.2, height: 0.85 }, price: 1199 },
  { name: 'Lounge Sofa Ottoman', type: 'sofa',   modelUrl: '/models/loungeSofaOttoman.glb',      thumbnailUrl: '/thumbnails/loungeSofaOttoman_NE.png',      dimensions: { width: 2.0, depth: 1.2, height: 0.85 }, price: 899  },
  { name: 'Design Sofa',         type: 'sofa',   modelUrl: '/models/loungeDesignSofa.glb',       thumbnailUrl: '/thumbnails/loungeDesignSofa_NE.png',       dimensions: { width: 2.0, depth: 0.9, height: 0.85 }, price: 1299 },
  { name: 'Design Sofa Corner',  type: 'sofa',   modelUrl: '/models/loungeDesignSofaCorner.glb', thumbnailUrl: '/thumbnails/loungeDesignSofaCorner_NE.png', dimensions: { width: 2.2, depth: 2.2, height: 0.85 }, price: 1499 },

  // Chairs
  { name: 'Chair',               type: 'chair',  modelUrl: '/models/chair.glb',                  thumbnailUrl: '/thumbnails/chair_NE.png',                  dimensions: { width: 0.5, depth: 0.5, height: 0.9  }, price: 149  },
  { name: 'Chair Cushion',       type: 'chair',  modelUrl: '/models/chairCushion.glb',           thumbnailUrl: '/thumbnails/chairCushion_NE.png',           dimensions: { width: 0.5, depth: 0.5, height: 0.9  }, price: 179  },
  { name: 'Chair Modern',        type: 'chair',  modelUrl: '/models/chairModernCushion.glb',     thumbnailUrl: '/thumbnails/chairModernCushion_NE.png',     dimensions: { width: 0.55,depth: 0.55,height: 0.9  }, price: 249  },
  { name: 'Chair Rounded',       type: 'chair',  modelUrl: '/models/chairRounded.glb',           thumbnailUrl: '/thumbnails/chairRounded_NE.png',           dimensions: { width: 0.55,depth: 0.55,height: 0.9  }, price: 199  },
  { name: 'Lounge Chair',        type: 'chair',  modelUrl: '/models/loungeChair.glb',            thumbnailUrl: '/thumbnails/loungeChair_NE.png',            dimensions: { width: 0.8, depth: 0.85,height: 0.9  }, price: 349  },
  { name: 'Lounge Chair Relax',  type: 'chair',  modelUrl: '/models/loungeChairRelax.glb',       thumbnailUrl: '/thumbnails/loungeChairRelax_NE.png',       dimensions: { width: 0.8, depth: 1.1, height: 0.9  }, price: 399  },
  { name: 'Design Chair',        type: 'chair',  modelUrl: '/models/loungeDesignChair.glb',      thumbnailUrl: '/thumbnails/loungeDesignChair_NE.png',      dimensions: { width: 0.7, depth: 0.7, height: 0.9  }, price: 299  },
  { name: 'Desk Chair',          type: 'chair',  modelUrl: '/models/chairDesk.glb',              thumbnailUrl: '/thumbnails/chairDesk_NE.png',              dimensions: { width: 0.6, depth: 0.6, height: 1.1  }, price: 199  },
  { name: 'Bar Stool',           type: 'chair',  modelUrl: '/models/stoolBar.glb',               thumbnailUrl: '/thumbnails/stoolBar_NE.png',               dimensions: { width: 0.4, depth: 0.4, height: 0.75 }, price: 129  },
  { name: 'Bar Stool Square',    type: 'chair',  modelUrl: '/models/stoolBarSquare.glb',         thumbnailUrl: '/thumbnails/stoolBarSquare_NE.png',         dimensions: { width: 0.4, depth: 0.4, height: 0.75 }, price: 129  },
  { name: 'Bench',               type: 'chair',  modelUrl: '/models/bench.glb',                  thumbnailUrl: '/thumbnails/bench_NE.png',                  dimensions: { width: 1.2, depth: 0.4, height: 0.5  }, price: 199  },
  { name: 'Bench Cushion',       type: 'chair',  modelUrl: '/models/benchCushion.glb',           thumbnailUrl: '/thumbnails/benchCushion_NE.png',           dimensions: { width: 1.2, depth: 0.4, height: 0.5  }, price: 229  },

  // Tables
  { name: 'Coffee Table',        type: 'table',  modelUrl: '/models/tableCoffee.glb',            thumbnailUrl: '/thumbnails/tableCoffee_NE.png',            dimensions: { width: 1.2, depth: 0.6, height: 0.45 }, price: 299  },
  { name: 'Coffee Table Glass',  type: 'table',  modelUrl: '/models/tableCoffeeGlass.glb',       thumbnailUrl: '/thumbnails/tableCoffeeGlass_NE.png',       dimensions: { width: 1.2, depth: 0.6, height: 0.45 }, price: 349  },
  { name: 'Coffee Table Square', type: 'table',  modelUrl: '/models/tableCoffeeSquare.glb',      thumbnailUrl: '/thumbnails/tableCoffeeSquare_NE.png',      dimensions: { width: 0.7, depth: 0.7, height: 0.45 }, price: 279  },
  { name: 'Dining Table',        type: 'table',  modelUrl: '/models/table.glb',                  thumbnailUrl: '/thumbnails/table_NE.png',                  dimensions: { width: 1.6, depth: 0.9, height: 0.75 }, price: 499  },
  { name: 'Round Table',         type: 'table',  modelUrl: '/models/tableRound.glb',             thumbnailUrl: '/thumbnails/tableRound_NE.png',             dimensions: { width: 1.0, depth: 1.0, height: 0.75 }, price: 399  },
  { name: 'Glass Table',         type: 'table',  modelUrl: '/models/tableGlass.glb',             thumbnailUrl: '/thumbnails/tableGlass_NE.png',             dimensions: { width: 1.6, depth: 0.9, height: 0.75 }, price: 599  },
  { name: 'Side Table',          type: 'table',  modelUrl: '/models/sideTable.glb',              thumbnailUrl: '/thumbnails/sideTable_NE.png',              dimensions: { width: 0.5, depth: 0.5, height: 0.6  }, price: 149  },
  { name: 'Side Table Drawers',  type: 'table',  modelUrl: '/models/sideTableDrawers.glb',       thumbnailUrl: '/thumbnails/sideTableDrawers_NE.png',       dimensions: { width: 0.5, depth: 0.5, height: 0.6  }, price: 179  },

  // Beds
  { name: 'Double Bed',          type: 'bed',    modelUrl: '/models/bedDouble.glb',              thumbnailUrl: '/thumbnails/bedDouble_NE.png',              dimensions: { width: 1.6, depth: 2.1, height: 0.6  }, price: 1299 },
  { name: 'Single Bed',          type: 'bed',    modelUrl: '/models/bedSingle.glb',              thumbnailUrl: '/thumbnails/bedSingle_NE.png',              dimensions: { width: 1.0, depth: 2.1, height: 0.6  }, price: 799  },
  { name: 'Bunk Bed',            type: 'bed',    modelUrl: '/models/bedBunk.glb',                thumbnailUrl: '/thumbnails/bedBunk_NE.png',                dimensions: { width: 1.0, depth: 2.1, height: 1.8  }, price: 999  },

  // Desks
  { name: 'Office Desk',         type: 'desk',   modelUrl: '/models/desk.glb',                   thumbnailUrl: '/thumbnails/desk_NE.png',                   dimensions: { width: 1.4, depth: 0.7, height: 0.75 }, price: 449  },
  { name: 'Corner Desk',         type: 'desk',   modelUrl: '/models/deskCorner.glb',             thumbnailUrl: '/thumbnails/deskCorner_NE.png',             dimensions: { width: 1.6, depth: 1.6, height: 0.75 }, price: 599  },

  // Shelves
  { name: 'Bookcase Open',       type: 'shelf',  modelUrl: '/models/bookcaseOpen.glb',           thumbnailUrl: '/thumbnails/bookcaseOpen_NE.png',           dimensions: { width: 0.8, depth: 0.3, height: 1.8  }, price: 259  },
  { name: 'Bookcase Closed',     type: 'shelf',  modelUrl: '/models/bookcaseClosed.glb',         thumbnailUrl: '/thumbnails/bookcaseClosed_NE.png',         dimensions: { width: 0.8, depth: 0.3, height: 1.8  }, price: 299  },
  { name: 'Bookcase Wide',       type: 'shelf',  modelUrl: '/models/bookcaseClosedWide.glb',     thumbnailUrl: '/thumbnails/bookcaseClosedWide_NE.png',     dimensions: { width: 1.2, depth: 0.3, height: 1.8  }, price: 349  },
  { name: 'Bookcase Open Low',   type: 'shelf',  modelUrl: '/models/bookcaseOpenLow.glb',        thumbnailUrl: '/thumbnails/bookcaseOpenLow_NE.png',        dimensions: { width: 0.8, depth: 0.3, height: 1.0  }, price: 199  },

  // Lamps
  { name: 'Floor Lamp Round',    type: 'lamp',   modelUrl: '/models/lampRoundFloor.glb',         thumbnailUrl: '/thumbnails/lampRoundFloor_NE.png',         dimensions: { width: 0.3, depth: 0.3, height: 1.6  }, price: 129  },
  { name: 'Floor Lamp Square',   type: 'lamp',   modelUrl: '/models/lampSquareFloor.glb',        thumbnailUrl: '/thumbnails/lampSquareFloor_NE.png',        dimensions: { width: 0.3, depth: 0.3, height: 1.6  }, price: 129  },
  { name: 'Table Lamp Round',    type: 'lamp',   modelUrl: '/models/lampRoundTable.glb',         thumbnailUrl: '/thumbnails/lampRoundTable_NE.png',         dimensions: { width: 0.2, depth: 0.2, height: 0.4  }, price: 79   },
  { name: 'Table Lamp Square',   type: 'lamp',   modelUrl: '/models/lampSquareTable.glb',        thumbnailUrl: '/thumbnails/lampSquareTable_NE.png',        dimensions: { width: 0.2, depth: 0.2, height: 0.4  }, price: 79   },
  { name: 'Ceiling Lamp',        type: 'lamp',   modelUrl: '/models/lampSquareCeiling.glb',      thumbnailUrl: '/thumbnails/lampSquareCeiling_NE.png',      dimensions: { width: 0.4, depth: 0.4, height: 0.2  }, price: 99   },
  { name: 'Wall Lamp',           type: 'lamp',   modelUrl: '/models/lampWall.glb',               thumbnailUrl: '/thumbnails/lampWall_NE.png',               dimensions: { width: 0.2, depth: 0.15,height: 0.3  }, price: 69   },

  // Plants
  { name: 'Potted Plant',        type: 'plant',  modelUrl: '/models/pottedPlant.glb',            thumbnailUrl: '/thumbnails/pottedPlant_NE.png',            dimensions: { width: 0.4, depth: 0.4, height: 0.9  }, price: 49   },
  { name: 'Small Plant 1',       type: 'plant',  modelUrl: '/models/plantSmall1.glb',            thumbnailUrl: '/thumbnails/plantSmall1_NE.png',            dimensions: { width: 0.2, depth: 0.2, height: 0.3  }, price: 29   },
  { name: 'Small Plant 2',       type: 'plant',  modelUrl: '/models/plantSmall2.glb',            thumbnailUrl: '/thumbnails/plantSmall2_NE.png',            dimensions: { width: 0.2, depth: 0.2, height: 0.3  }, price: 29   },
  { name: 'Small Plant 3',       type: 'plant',  modelUrl: '/models/plantSmall3.glb',            thumbnailUrl: '/thumbnails/plantSmall3_NE.png',            dimensions: { width: 0.2, depth: 0.2, height: 0.3  }, price: 29   },

  // Rugs
  { name: 'Rectangle Rug',       type: 'rug',    modelUrl: '/models/rugRectangle.glb',           thumbnailUrl: '/thumbnails/rugRectangle_NE.png',           dimensions: { width: 2.0, depth: 3.0, height: 0.01 }, price: 199  },
  { name: 'Round Rug',           type: 'rug',    modelUrl: '/models/rugRound.glb',               thumbnailUrl: '/thumbnails/rugRound_NE.png',               dimensions: { width: 1.5, depth: 1.5, height: 0.01 }, price: 149  },
  { name: 'Square Rug',          type: 'rug',    modelUrl: '/models/rugSquare.glb',              thumbnailUrl: '/thumbnails/rugSquare_NE.png',              dimensions: { width: 1.5, depth: 1.5, height: 0.01 }, price: 149  },
  { name: 'Rounded Rug',         type: 'rug',    modelUrl: '/models/rugRounded.glb',             thumbnailUrl: '/thumbnails/rugRounded_NE.png',             dimensions: { width: 2.0, depth: 3.0, height: 0.01 }, price: 179  },
  { name: 'Doormat',             type: 'rug',    modelUrl: '/models/rugDoormat.glb',             thumbnailUrl: '/thumbnails/rugDoormat_NE.png',             dimensions: { width: 0.6, depth: 0.9, height: 0.01 }, price: 39   },

  // Other
  { name: 'TV Cabinet',          type: 'other',  modelUrl: '/models/cabinetTelevision.glb',      thumbnailUrl: '/thumbnails/cabinetTelevision_NE.png',      dimensions: { width: 1.6, depth: 0.4, height: 0.55 }, price: 499  },
  { name: 'TV Cabinet Doors',    type: 'other',  modelUrl: '/models/cabinetTelevisionDoors.glb', thumbnailUrl: '/thumbnails/cabinetTelevisionDoors_NE.png', dimensions: { width: 1.6, depth: 0.4, height: 0.55 }, price: 549  },
  { name: 'Bedside Cabinet',     type: 'other',  modelUrl: '/models/cabinetBed.glb',             thumbnailUrl: '/thumbnails/cabinetBed_NE.png',             dimensions: { width: 0.5, depth: 0.4, height: 0.55 }, price: 179  },
  { name: 'Bedside Drawer',      type: 'other',  modelUrl: '/models/cabinetBedDrawer.glb',       thumbnailUrl: '/thumbnails/cabinetBedDrawer_NE.png',       dimensions: { width: 0.5, depth: 0.4, height: 0.55 }, price: 199  },
  { name: 'Television Modern',   type: 'other',  modelUrl: '/models/televisionModern.glb',       thumbnailUrl: '/thumbnails/televisionModern_NE.png',       dimensions: { width: 1.2, depth: 0.1, height: 0.7  }, price: 799  },
  { name: 'Television Vintage',  type: 'other',  modelUrl: '/models/televisionVintage.glb',      thumbnailUrl: '/thumbnails/televisionVintage_NE.png',      dimensions: { width: 0.6, depth: 0.4, height: 0.5  }, price: 299  },
  { name: 'Coat Rack Standing',  type: 'other',  modelUrl: '/models/coatRackStanding.glb',       thumbnailUrl: '/thumbnails/coatRackStanding_NE.png',       dimensions: { width: 0.4, depth: 0.4, height: 1.7  }, price: 89   },
  { name: 'Computer Screen',     type: 'other',  modelUrl: '/models/computerScreen.glb',         thumbnailUrl: '/thumbnails/computerScreen_NE.png',         dimensions: { width: 0.6, depth: 0.2, height: 0.5  }, price: 299  },
  { name: 'Laptop',              type: 'other',  modelUrl: '/models/laptop.glb',                 thumbnailUrl: '/thumbnails/laptop_NE.png',                 dimensions: { width: 0.35,depth: 0.25,height: 0.02 }, price: 999  },
  { name: 'Speaker',             type: 'other',  modelUrl: '/models/speaker.glb',                thumbnailUrl: '/thumbnails/speaker_NE.png',                dimensions: { width: 0.3, depth: 0.3, height: 0.5  }, price: 199  },
  { name: 'Ceiling Fan',         type: 'other',  modelUrl: '/models/ceilingFan.glb',             thumbnailUrl: '/thumbnails/ceilingFan_NE.png',             dimensions: { width: 1.2, depth: 1.2, height: 0.3  }, price: 149  },
  { name: 'Pillow',              type: 'other',  modelUrl: '/models/pillow.glb',                 thumbnailUrl: '/thumbnails/pillow_NE.png',                 dimensions: { width: 0.5, depth: 0.5, height: 0.15 }, price: 29   },

  // Kitchen
  { name: 'Kitchen Fridge',      type: 'other',  modelUrl: '/models/kitchenFridge.glb',          thumbnailUrl: '/thumbnails/kitchenFridge_NE.png',          dimensions: { width: 0.7, depth: 0.7, height: 1.8  }, price: 899  },
  { name: 'Kitchen Stove',       type: 'other',  modelUrl: '/models/kitchenStove.glb',           thumbnailUrl: '/thumbnails/kitchenStove_NE.png',           dimensions: { width: 0.6, depth: 0.6, height: 0.9  }, price: 599  },
  { name: 'Kitchen Sink',        type: 'other',  modelUrl: '/models/kitchenSink.glb',            thumbnailUrl: '/thumbnails/kitchenSink_NE.png',            dimensions: { width: 0.6, depth: 0.5, height: 0.9  }, price: 299  },
  { name: 'Kitchen Cabinet',     type: 'other',  modelUrl: '/models/kitchenCabinet.glb',         thumbnailUrl: '/thumbnails/kitchenCabinet_NE.png',         dimensions: { width: 0.6, depth: 0.6, height: 0.9  }, price: 249  },
  { name: 'Microwave',           type: 'other',  modelUrl: '/models/kitchenMicrowave.glb',       thumbnailUrl: '/thumbnails/kitchenMicrowave_NE.png',       dimensions: { width: 0.5, depth: 0.4, height: 0.3  }, price: 149  },

  // Bathroom
  { name: 'Bathtub',             type: 'other',  modelUrl: '/models/bathtub.glb',                thumbnailUrl: '/thumbnails/bathtub_NE.png',                dimensions: { width: 0.8, depth: 1.7, height: 0.6  }, price: 799  },
  { name: 'Bathroom Sink',       type: 'other',  modelUrl: '/models/bathroomSink.glb',           thumbnailUrl: '/thumbnails/bathroomSink_NE.png',           dimensions: { width: 0.5, depth: 0.4, height: 0.85 }, price: 299  },
  { name: 'Toilet',              type: 'other',  modelUrl: '/models/toilet.glb',                 thumbnailUrl: '/thumbnails/toilet_NE.png',                 dimensions: { width: 0.4, depth: 0.7, height: 0.8  }, price: 199  },
  { name: 'Shower',              type: 'other',  modelUrl: '/models/shower.glb',                 thumbnailUrl: '/thumbnails/shower_NE.png',                 dimensions: { width: 0.9, depth: 0.9, height: 2.1  }, price: 599  },
  { name: 'Bathroom Cabinet',    type: 'other',  modelUrl: '/models/bathroomCabinet.glb',        thumbnailUrl: '/thumbnails/bathroomCabinet_NE.png',        dimensions: { width: 0.6, depth: 0.3, height: 0.9  }, price: 249  },
  { name: 'Bathroom Mirror',     type: 'other',  modelUrl: '/models/bathroomMirror.glb',         thumbnailUrl: '/thumbnails/bathroomMirror_NE.png',         dimensions: { width: 0.6, depth: 0.1, height: 0.8  }, price: 149  },
  { name: 'Washer',              type: 'other',  modelUrl: '/models/washer.glb',                 thumbnailUrl: '/thumbnails/washer_NE.png',                 dimensions: { width: 0.6, depth: 0.6, height: 0.85 }, price: 499  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  await Furniture.deleteMany({});
  const docs = await Furniture.insertMany(FURNITURE);
  console.log(`✅ Seeded ${docs.length} furniture items`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });