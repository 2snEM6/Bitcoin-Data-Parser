import { Router } from 'express';
import { Sequelize } from 'sequelize';

export const router = Router();

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASSWORD,
	{
		dialect: 'postgres',
		logging: false,
	},
);

router.get('/opreturn/:data', async (req, res) => {
	const opReturnData = req.params.data;

	const queryResult = await sequelize.query(
		`SELECT "data", "height", "blockHash", "txHash" as "txId" from opreturns WHERE data LIKE '%${opReturnData}%';`,
	);

	res.json({
		query: opReturnData,
		op_returns: queryResult[0],
	});
});
