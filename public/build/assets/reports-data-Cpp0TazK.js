import { C as purchaseBills, f as financialTransactions, k as allSales, m as allExpenses } from "./app-CwPUaRAl.js";
//#region resources/js/data/reports-data.ts
function filterByDateRange(items, range) {
	return items.filter((i) => i.date >= range.from && i.date <= range.to);
}
function getCashFlow(range) {
	const rows = [];
	for (const s of filterByDateRange(allSales, range)) if (s.amountPaid > 0) rows.push({
		date: s.date,
		type: s.invoiceNumber.startsWith("RET-") ? "Refund Out" : "Sale",
		description: `${s.invoiceNumber} — ${s.customerName || "Walk-in"}`,
		inflow: s.invoiceNumber.startsWith("RET-") ? 0 : s.amountPaid,
		outflow: s.invoiceNumber.startsWith("RET-") ? s.amountPaid : 0
	});
	for (const b of filterByDateRange(purchaseBills, range)) if (b.amountPaid > 0) rows.push({
		date: b.date,
		type: b.invoiceRef.startsWith("PRET-") ? "Refund In" : "Purchase",
		description: `${b.invoiceRef} — ${b.supplierName}`,
		inflow: b.invoiceRef.startsWith("PRET-") ? b.amountPaid : 0,
		outflow: b.invoiceRef.startsWith("PRET-") ? 0 : b.amountPaid
	});
	for (const e of filterByDateRange(allExpenses, range)) rows.push({
		date: e.date,
		type: "Expense",
		description: `${e.categoryName} — ${e.paidTo}`,
		inflow: 0,
		outflow: e.amount
	});
	for (const ft of filterByDateRange(financialTransactions, range)) if (ft.direction === "in") rows.push({
		date: ft.date,
		type: ft.type,
		description: ft.description || ft.reference,
		inflow: ft.amount,
		outflow: 0
	});
	else rows.push({
		date: ft.date,
		type: ft.type,
		description: ft.description || ft.reference,
		inflow: 0,
		outflow: ft.amount
	});
	rows.sort((a, b) => a.date.localeCompare(b.date));
	const totalIn = rows.reduce((s, r) => s + r.inflow, 0);
	const totalOut = rows.reduce((s, r) => s + r.outflow, 0);
	const openingBalance = financialTransactions.filter((ft) => ft.date < range.from).reduce((s, ft) => s + (ft.direction === "in" ? ft.amount : 0), 0) - financialTransactions.filter((ft) => ft.date < range.from).reduce((s, ft) => s + (ft.direction === "out" ? ft.amount : 0), 0);
	return {
		rows,
		totalIn,
		totalOut,
		openingBalance,
		closingBalance: openingBalance + totalIn - totalOut
	};
}
function getProfitLoss(range) {
	const sales = filterByDateRange(allSales, range);
	const purchases = filterByDateRange(purchaseBills, range);
	const expenses = filterByDateRange(allExpenses, range);
	const revenue = sales.filter((s) => !s.invoiceNumber.startsWith("RET-")).reduce((s, x) => s + x.grandTotal, 0);
	const saleReturns = sales.filter((s) => s.invoiceNumber.startsWith("RET-")).reduce((s, x) => s + x.grandTotal, 0);
	const netRevenue = revenue - saleReturns;
	const cogs = purchases.filter((b) => !b.invoiceRef.startsWith("PRET-")).reduce((s, b) => s + b.totalAmount, 0);
	const grossProfit = netRevenue - cogs;
	const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
	return {
		revenue,
		saleReturns,
		netRevenue,
		cogs,
		grossProfit,
		totalExpenses,
		netProfit: grossProfit - totalExpenses
	};
}
function getPartyStatement(range, partyName, partyType) {
	const rows = [];
	let balance = 0;
	if (!partyType || partyType === "customer") {
		for (const s of filterByDateRange(allSales, range)) if (s.customerName?.toLowerCase().includes(partyName.toLowerCase())) {
			balance += s.grandTotal;
			rows.push({
				date: s.date,
				type: s.invoiceNumber.startsWith("RET-") ? "Sale Return" : "Sale",
				ref: s.invoiceNumber,
				description: `${s.customerName} — ${s.items.length} items`,
				debit: s.invoiceNumber.startsWith("RET-") ? 0 : s.grandTotal,
				credit: s.invoiceNumber.startsWith("RET-") ? s.grandTotal : 0,
				balance
			});
		}
	}
	if (!partyType || partyType === "supplier") {
		for (const b of filterByDateRange(purchaseBills, range)) if (b.supplierName.toLowerCase().includes(partyName.toLowerCase())) {
			balance -= b.totalAmount;
			rows.push({
				date: b.date,
				type: b.invoiceRef.startsWith("PRET-") ? "Purchase Return" : "Purchase",
				ref: b.invoiceRef,
				description: `Purchase from ${b.supplierName}`,
				debit: b.invoiceRef.startsWith("PRET-") ? b.totalAmount : 0,
				credit: b.invoiceRef.startsWith("PRET-") ? 0 : b.totalAmount,
				balance
			});
		}
	}
	rows.sort((a, b) => a.date.localeCompare(b.date));
	return rows;
}
//#endregion
export { getPartyStatement as n, getProfitLoss as r, getCashFlow as t };
