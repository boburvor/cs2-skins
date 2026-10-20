const { Router } = require('express');
const {
    getAllSkins,
    getSkinById,
    createSkin,
    updateSkin,
    updateSkinImage,
    deleteSkin,
} = require('../controllers/skins.controlles');
const { skinSchema, skinUpdateSchema, idParamSchema } = require("../validations/skin.validation");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const { verifyImage } = upload;
const router = Router();

router.get('/', getAllSkins);
router.get('/:id', validate(idParamSchema, 'params'), getSkinById);
router.post('/', upload.single('skinImage'), verifyImage, validate(skinSchema), createSkin);
router.put('/:id', validate(idParamSchema, 'params'), upload.single('skinImage'), verifyImage, validate(skinSchema), updateSkin);
router.patch('/:id', validate(idParamSchema, 'params'), upload.single('skinImage'), verifyImage, validate(skinUpdateSchema), updateSkin);
router.patch('/:id/image', validate(idParamSchema, 'params'), upload.single('skinImage'), verifyImage, updateSkinImage);
router.delete('/:id', validate(idParamSchema, 'params'), deleteSkin);

module.exports = router;
