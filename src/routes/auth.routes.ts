import { Router } from 'express'
import { googleLogin, profile } from '../controllers/auth.controller'
import { testSelect } from '../controllers/test_select.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', (req, res) => {
    const data: Object = {
        query: req.query,
        body: req.body,
        params: req.params
    }
    res.json(data)
})

router.get('/test', testSelect)
router.post('/google', googleLogin)

router.get(
    '/profile',
    authMiddleware,
    profile
)

export default router