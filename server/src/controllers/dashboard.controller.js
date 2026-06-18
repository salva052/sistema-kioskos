const DashboardService = require('../services/dashboard.service');

const DashboardController = {
  async resumen(req, res, next) {
    try {
      res.json(await DashboardService.resumen({ desde: req.query.desde, hasta: req.query.hasta }));
    } catch (e) { next(e); }
  },
};

module.exports = DashboardController;
