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

	d3.json('data.json', (error, json) => {
		if (error) throw error;

		const circleGroup = svg.append('g');
		const centerGroup = svg.append('g');
		let means = [];

		const circles = circleGroup
			.selectAll('circle')
			.data(json.nodes)

		circles
			.enter()
			.append('circle')
			.attr('cx', 0)
			.attr('cy', 0)
			.attr('r', 10)
			.attr('fill', 'white')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.style('transition', 'transform .5s ease')
			.style('transform', (data) => {
				return `translate(${500 + data['乳'] * 150}px, ${400 + data['最高だぜ'] * 150}px)`;
			});

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

		const init = () => {
			means = [];
			for (var i = 0; i < 2; i++) {
				means.push(Math.random() * 4 - 2);
			}

			const centers = centerGroup
				.selectAll('path')
				.data(means);

			centers
				.enter()
				.append('path')
			    .attr('d', 'M-5.366563145999495,-1.7888543819998317H-1.7888543819998317V-5.366563145999495H1.7888543819998317V-1.7888543819998317H5.366563145999495V1.7888543819998317H1.7888543819998317V5.366563145999495H-1.7888543819998317V1.7888543819998317H-5.366563145999495Z')
				.attr('stroke', 'white')
				.attr('fill', 'red')
				.style('transition', 'transform .5s ease')
				.style('transform', (data) => {
					return `translate(${500 + data * 150}px, ${400 + data * 150}px) rotate(45deg)`;
				});
		};

		init();
	});
});
