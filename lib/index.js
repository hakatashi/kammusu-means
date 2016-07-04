const $ = require('jquery');
const d3 = require('d3');

$(document).ready(() => {
	const svg = d3.select("#svg")
		.attr('width', 1140)
		.attr('height', 800)
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

	const dots = svg.append('g');
	const centers = svg.append('g');
	d3.select("#step")
		.on('click', () => { step(); draw(); });
	d3.select("#reset")
		.on('click', () => { init(); draw(); });

	let currentStep = 'E';

	const step = () => {
		if (currentStep === 'E') {
			currentStep = 'M';
		} else if (currentStep === 'M') {
			currentStep = 'E';
		}
	};

	d3.json('data.json', (error, json) => {
		if (error) throw error;

		const circles = dots
			.selectAll('circle')
			.data(json.nodes)
			.enter();

		circles
			.append('circle')
			.attr('cx', 0)
			.attr('cy', 0)
			.attr('r', 10)
			.attr('fill', 'white')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.style('transform', (data) => {
				return `translate(${500 + data['乳'] * 150}px, ${400 + data['最高だぜ'] * 150}px)`
			});
	});
});
