const $ = require('jquery');
const d3 = require('d3');
const {dot, sub, add, eig, inv, det, mul, div, transpose} = require('numeric');

const distance = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
const translate = (x, y) => `translate(${x}px, ${y}px)`;
const translateData = (x, y) => translate(400 + x * 100, 400 - y * 100);
const translateText = (x, y) => translate(407 + x * 100, 400 - y * 100);

// https://en.wikipedia.org/wiki/Multivariate_normal_distribution#Non-degenerate_case
const gaussianDistribution = (x, mu, sigma) =>
	Math.exp(- (1 / 2) * dot(dot(sub(x, mu), inv(sigma)), sub(x, mu)))
		/ Math.sqrt(Math.pow(2 * Math.PI, x.length) * det(sigma));

let ref;

// http://www.visiondummy.com/2014/04/draw-error-ellipse-representing-covariance-matrix/
// http://d.hatena.ne.jp/natsutan/20110421/1303344155
const sigmaToEllipse = (sigma) => {
	const eigenValues = eig(sigma);

	return {
		rx: Math.abs(eigenValues.lambda.x[0]) * 100,
		ry: Math.abs(eigenValues.lambda.x[1]) * 100,
		rotate: Math.atan2(-eigenValues.E.x[0][1], -eigenValues.E.x[0][0]) / Math.PI * 180,
	};
};

$(document).ready(() => {
	const svg = d3.select('#svg')
		.attr('viewBox', '0 0 800 800')
		.attr('width', '100%')
		.attr('height', '100%')
		.style('background', '#223344')
		.style('cursor', 'pointer')
		.style('-webkit-user-select', 'none')
		.style('-moz-user-select', 'none')
		.style('-ms-user-select', 'none')
		.style('user-select', 'none');

	let xAxis = 'R-18';
	let yAxis = '最高だぜ';
	let mode = 'kmeans';

	d3.json('data.json', (error, json) => {
		if (error) throw error;

		const circleGroup = svg.append('g');
		const textGroup = svg.append('g');
		const centerGroup = svg.append('g');
		const ellipseGroup = svg.append('g');

		let means = [];

		circleGroup
			.selectAll('circle')
			.data(json.nodes)
			.enter()
			.append('circle')
			.attr('cx', 0)
			.attr('cy', 0)
			.attr('r', 5)
			.attr('fill', 'white')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.style('transition', 'transform .5s ease');

		textGroup
			.selectAll('text')
			.data(json.nodes)
			.enter()
			.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', 'white')
			.attr('dominant-baseline', 'central')
			.text((data) => data.name)
			.style('transition', 'transform .5s ease')
			.style('font-size', '10px');

		d3.selectAll('#step, #svg')
			.on('click', () => { step(); });
		d3.selectAll('#reset')
			.on('click', () => { init(); });

		let currentStep = 'E';

		var step = () => {
			if (currentStep === 'E') {
				circleGroup
					.selectAll('circle')
					.attr('fill', (data, i, nodes) => {
						if (mode === 'kmeans') {
							let minWeight = Infinity;
							let minIndex = null;

							means.forEach((mean, index) => {
								const weight = distance(mean, {x: data[xAxis], y: data[yAxis]});
								if (weight < minWeight) {
									minWeight = weight;
									minIndex = index;
								}
							});

							if (minIndex === 0) {
								return 'red';
							} else if (minIndex === 1) {
								return 'blue';
							}
						} else if (mode === 'em') {
							const gammaRatios = means.map((mean) => {
								return mean.pi * gaussianDistribution(
									[data[xAxis], data[yAxis]].map(parseFloat),
									[mean.mu.x, mean.mu.y],
									mean.sigma
								);
							});

							const ratioSum = gammaRatios.reduce((a, b) => a + b);
							const gammas = gammaRatios.map((ratio) => ratio / ratioSum);

							$(nodes[i]).data('gammas', gammas);

							return `rgb(${Math.round(255 * gammas[0])}, 0, ${Math.round(255 * gammas[1])})`;
						}
					});

				currentStep = 'M';
			} else if (currentStep === 'M') 	{
				const circles = circleGroup.selectAll('circle');

				if (mode === 'kmeans') {
					['red', 'blue'].forEach((color, index) => {
						const sum = {x: 0, y: 0};
						let num = 0;
						circles.each(function (data) {
							const fill = d3.select(this).attr('fill');
							if (fill === color) {
								sum.x += parseFloat(data[xAxis]);
								sum.y += parseFloat(data[yAxis]);
								num++;
							}
						});
						means[index].x = sum.x / num;
						means[index].y = sum.y / num;
					});
				} else if (mode === 'em') {
					means = means.map((mean, index) => {
						const circleData = [];
						circles.each(function (data) {
							const gamma = $(this).data('gammas')[index];
							circleData.push({gamma, x: data[xAxis], y: data[yAxis]});
						});

						const color = mean.color;

						const gammaXSum = circleData.map(data => data.gamma * data.x).reduce((a, b) => a + b);
						const gammaYSum = circleData.map(data => data.gamma * data.y).reduce((a, b) => a + b);
						const gammaSum = circleData.map(data => data.gamma).reduce((a, b) => a + b);

						const mu = {
							x: gammaXSum / gammaSum,
							y: gammaYSum / gammaSum,
						};

						const sigmaSum = circleData.map(data => {
							const vector = [[data.x - mu.x], [data.y - mu.y]];
							return mul(data.gamma, dot(vector, transpose(vector)));
						}).reduce((a, b) => add(a, b));

						const sigma = div(sigmaSum, gammaSum);

						const pi = gammaSum / circleData.length;

						return {color, mu, sigma, pi};
					});

					ellipseGroup
						.selectAll('ellipse')
						.data(means)
						.transition()
						.duration(500)
						.attr('rx', (data) => sigmaToEllipse(data.sigma).rx)
						.attr('ry', (data) => sigmaToEllipse(data.sigma).ry)
						.style('transform', (data) => {
							return `${translateData(data.mu.x, data.mu.y)} rotate(${sigmaToEllipse(data.sigma).rotate}deg)`;
						});
				}

				centerGroup
					.selectAll('path')
					.data(means)
					.style('transform', (data) => {
						if (mode === 'kmeans') {
							return `${translateData(data.x, data.y)} rotate(45deg)`;
						} else if (mode === 'em') {
							return `${translateData(data.mu.x, data.mu.y)} rotate(45deg)`;
						}
					});

				currentStep = 'E';
			}
		};

		var init = () => {
			means = [];

			if (mode === 'kmeans') {
				for (let i = 0; i < 2; i++) {
					means.push({
						color: ['red', 'blue'][i],
						x: Math.random() * 4 - 2,
						y: Math.random() * 4 - 2,
					});
				}

				centerGroup
					.selectAll('path')
					.data(means)
					.enter()
					.append('path');

				ellipseGroup
					.selectAll('ellipse')
					.remove();
			} else if (mode === 'em') {
				for (let i = 0; i < 2; i++) {
					const sigma11 = Math.random() * 2;
					const sigma22 = Math.random() * 2;
					// determinant should be positive
					const sigma12 = Math.random() * Math.sqrt(sigma11 * sigma22);

					means.push({
						color: ['red', 'blue'][i],
						mu: {
							x: Math.random() * 4 - 2,
							y: Math.random() * 4 - 2,
						},
						sigma: [
							[sigma11, sigma12],
							[sigma12, sigma22],
						],
						pi: 0.5,
					});
				}

				centerGroup
					.selectAll('path')
					.data(means)
					.enter()
					.append('path');

				ellipseGroup
					.selectAll('ellipse')
					.data(means)
					.enter()
					.append('ellipse')
					.style('opacity', 0)
					.transition()
					.duration(300)
					.style('opacity', 1);
			}

			centerGroup
				.selectAll('path')
			    .attr('d', d3.symbol().type(d3.symbolCross))
				.attr('stroke', 'white')
				.attr('fill', (data) => data.color)
				.style('transition', 'transform .5s ease')
				.style('transform', (data) => {
					if (mode === 'kmeans') {
						return `${translateData(data.x, data.y)} rotate(45deg)`;
					} else if (mode === 'em') {
						return `${translateData(data.mu.x, data.mu.y)} rotate(45deg)`;
					}
				});

			ellipseGroup
				.selectAll('ellipse')
				.attr('fill', 'none')
				.attr('stroke', (data) => data.color)
				.transition()
				.duration(500)
				.attr('rx', (data) => sigmaToEllipse(data.sigma).rx)
				.attr('ry', (data) => sigmaToEllipse(data.sigma).ry)
				.style('opacity', 1)
				.style('transform', (data) => {
					return `${translateData(data.mu.x, data.mu.y)} rotate(${sigmaToEllipse(data.sigma).rotate}deg)`;
				});

			circleGroup
				.selectAll('circle')
				.style('transform', (data) => {
					return translateData(data[xAxis], data[yAxis]);
				})
				.attr('fill', 'white');

			textGroup
				.selectAll('text')
				.style('transform', (data) => {
					return translateText(data[xAxis], data[yAxis]);
				});

			currentStep = 'E';
		};

		$('select').change((event) => {
			xAxis = $('[name=x]').val();
			yAxis = $('[name=y]').val();
			mode = $('[name=mode]').val();
			init();
		});

		init();
	});
});
