const $ = require('jquery');
const d3 = require('d3');

const distance = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
const translate = (x, y) => `translate(${x}px, ${y}px)`;

$(document).ready(() => {
	const svg = d3.select("#svg")
		.attr('viewBox', '0 0 800 800')
		.attr('width', '100%')
		.attr('height', '100%')
		.style('background', '#223344')
		.style('cursor', 'pointer')
		.style('-webkit-user-select', 'none')
		.style('-khtml-user-select', 'none')
		.style('-moz-user-select', 'none')
		.style('-ms-user-select', 'none')
		.style('user-select', 'none')
		.on('click', function() {
			d3.event.preventDefault();
		});

	let xAxis = 'R-18';
	let yAxis = '最高だぜ';

	d3.json('data.json', (error, json) => {
		if (error) throw error;

		const circleGroup = svg.append('g');
		const centerGroup = svg.append('g');
		const textGroup = svg.append('g');
		let means = [];

		const circles = circleGroup
			.selectAll('circle')
			.data(json.nodes)

		circles
			.enter()
			.append('circle')
			.attr('cx', 0)
			.attr('cy', 0)
			.attr('r', 5)
			.attr('fill', 'white')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.style('transition', 'transform .5s ease')
			.style('transform', (data) => {
				return translate(400 + data[xAxis] * 100, 400 - data[yAxis] * 100);
			});

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
			.style('font-size', '10px')
			.style('transform', (data) => {
				return translate(407 + data[xAxis] * 100, 400 - data[yAxis] * 100);
			});

		d3.select("#step")
			.on('click', () => { step(); });
		d3.select("#reset")
			.on('click', () => { init(); });

		let currentStep = 'E';

		const step = () => {
			if (currentStep === 'E') {
				circleGroup
					.selectAll('circle')
					.attr('fill', (data) => {
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
					});

				currentStep = 'M';
			} else if (currentStep === 'M') 	{
				const circles = circleGroup.selectAll('circle');
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

				const centers = centerGroup
					.selectAll('path')
					.data(means)
					.style('transform', (data) => {
						return translate(400 + data.x * 100, 400 - data.y * 100) + ' rotate(45deg)';
					});

				currentStep = 'E';
			}
		};

		const init = () => {
			means = [];
			for (var i = 0; i < 2; i++) {
				means.push({
					color: ['red', 'blue'][i],
					x: Math.random() * 4 - 2,
					y: Math.random() * 4 - 2,
				});
			}

			const centers = centerGroup
				.selectAll('path')
				.data(means)
				.style('transform', (data) => {
					return translate(400 + data.x * 100, 400 - data.y * 100) + ' rotate(45deg)';
				});

			centers
				.enter()
				.append('path')
			    .attr('d', 'M-5.366563145999495,-1.7888543819998317H-1.7888543819998317V-5.366563145999495H1.7888543819998317V-1.7888543819998317H5.366563145999495V1.7888543819998317H1.7888543819998317V5.366563145999495H-1.7888543819998317V1.7888543819998317H-5.366563145999495Z')
				.attr('stroke', 'white')
				.attr('fill', (data) => data.color)
				.style('transition', 'transform .5s ease')
				.style('transform', (data) => {
					return translate(400 + data.x * 100, 400 - data.y * 100) + ' rotate(45deg)';
				});

			circleGroup
				.selectAll('circle')
				.style('transform', (data) => {
					return translate(400 + data[xAxis] * 100, 400 - data[yAxis] * 100);
				})
				.attr('fill', 'white');

			textGroup
				.selectAll('text')
				.style('transform', (data) => {
					return translate(407 + data[xAxis] * 100, 400 - data[yAxis] * 100);
				});

			currentStep = 'E';
		};

		$('select').change((event) => {
			xAxis = $('[name=x]').val()
			yAxis = $('[name=y]').val()
			init();
		});

		init();
	});
});
