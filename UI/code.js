Vue.component('dependency-graph', {
  template:
    `<div :style="{ width: width + 'px', height: height + 'px', border: '1px solid black' }">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="innerGrid" :width="innerGridSize" :height="innerGridSize" patternUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="none" stroke="#CCCCCC7A" stroke-width="0.5"/>
          </pattern>
          <pattern id="grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="url(#innerGrid)" stroke="#CCCCCC7A" stroke-width="1.5"/>
          </pattern>
        </defs>
      </svg>
    </div>`,
  props: ['data', 'force'],
  data() {
    return {
      selectedNode: [],
      width: 1024,
      height: 768,
      gridSize: 100,
      selections: {},
      simulation: null,
      forceProperties: {
        center: {
		  enabled: this.force,
          x: 0.5,
          y: 0.5,
        },
        charge: {
          enabled: this.force,
          strength: -1000,
          distanceMin: 100,
          distanceMax: 1000
        },
        collide: {
          enabled: this.force,
          strength: 1,
          iterations: 1,
          radius: 35
        },
        forceX: {
          enabled: false && this.force,
          strength: 0.05,
          x: 0
        },
        forceY: {
          enabled: false && this.force,
          strength: 0.05,
          y: 0.5
        },
        link: {
          enabled: this.force,
          distance: 200,
          iterations: 1
        }
      },
    }
  },
  computed: {
    innerGridSize() { return this.gridSize / 10 },
    nodes() { return this.data.nodes },
    links() { return this.data.links },

    // These are needed for captions
    linkTypes() {
      const linkTypes = []
      this.links.forEach(link => {
        if (linkTypes.indexOf(link.type) === -1)
          linkTypes.push(link.type)
      })
      return linkTypes.sort()
    },
    classes() {
      const classes = []
      this.nodes.forEach(node => {
        if (classes.indexOf(node.class) === -1)
          classes.push(node.class)
      })
      return classes.sort()
    },
  },

  created() {
    // You can set the component width and height in any way
    // you prefer. It's responsive! :)
    this.width = window.innerWidth - 10;
    this.height = window.innerHeight - 50;
	var xScale = d3.scaleLinear().domain([0, 1]).range([0, 600]);
  
    this.simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function (d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter())
      .force("forceX", d3.forceX().x(function(d) {    return 0.2 ;  }))
      .force("forceY", d3.forceY())
      .on("tick", this.tick)
    // Call first time to setup default values
    this.updateForces()
  },
  mounted() {
    this.selections.svg = d3.select(this.$el.querySelector("svg"))
    const svg = this.selections.svg

    // Define the arrow marker
    svg.append("svg:defs").selectAll("marker")
      .data(["end"])     // Different link/path types can be defined here
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 43)              // Prevents arrowhead from being covered by circle
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    // Define arrow for self-links
    svg.append("svg:defs").selectAll("marker")
      .data(["end-self"])
      .enter().append("svg:marker")    // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 40)
      .attr("refY", -15)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", 285)
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    // Add zoom and panning triggers
    this.zoom = d3.zoom()
      .scaleExtent([1 / 4, 4])
      .on('zoom', this.zoomed)
    svg.call(this.zoom)

    // A background grid to help user experience
    // The width and height depends on the minimum scale extent and
    // the + 10% and negative index to create an infinite grid feel
    // The precedence of this element is important since you'll have
    // click events on the elements above the grid
    this.selections.grid = svg.append('rect')
      .attr('x', '-10%')
      .attr('y', '-10%')
      .attr('width', '410%')
      .attr('height', '410%')
      .attr('fill', 'url(#grid)')

    this.selections.graph = svg.append("g")

    // Node and link count is nice :)
    this.selections.stats = svg.append('text')
      .attr('x', '1%')
      .attr('y', '98%')
      .attr('text-anchor', 'left');

    // Some caption
    this.selections.caption = svg.append('g');
    this.selections.caption.append('rect')
      .attr('width', '200')
      .attr('height', '0')
      .attr('rx', '10')
      .attr('ry', '10')
      .attr('class', 'caption');
  },
  methods: {
    tick() {
      // If no data is passed to the Vue component, do nothing
      if (!this.data) { return }
      const transform = d => {
        return "translate(" + d.x + "," + d.y + ")"
      }

      const link = d => {
        // Self-link support
        if (d.source.index === d.target.index) {
          return `M${d.source.x - 1},${d.source.y - 1}A30,30 -10,1,0 ${d.target.x + 1},${d.target.y + 1}`;
        } else {
          return "M" + d.source.x + "," + d.source.y + " L" + d.target.x + "," + d.target.y;
        }
      }

      const graph = this.selections.graph
      graph.selectAll("path").attr("d", link)
      graph.selectAll("circle").attr("transform", transform)
      graph.selectAll("text").attr("transform", transform)

      this.updateNodeLinkCount()
    },
    updateData() {
      this.simulation.nodes(this.nodes)
      this.simulation.force("link").links(this.links)

      const simulation = this.simulation
      const graph = this.selections.graph

      // Links should only exit if not needed anymore
      graph.selectAll("path")
        .data(this.links)
        .exit().remove()

      graph.selectAll("path")
        .data(this.links)
        .enter().append("path")
        .attr("class", d => "link " + d.type)

      // Nodes should always be redrawn to avoid lines above them
      graph.selectAll("circle").remove()
      graph.selectAll("circle")
        .data(this.nodes)
        .enter().append("circle")
        .attr("r", 30)
        .attr("class", d => d.class)
        .call(d3.drag()
          .on('start', this.nodeDragStarted)
          .on('drag', this.nodeDragged)
          .on('end', this.nodeDragEnded))
        .on('click', this.nodeClick)


      graph.selectAll("text").remove()
      graph.selectAll("text")
        .data(this.nodes)
        .enter().append("text")
        .attr("x", 0)
        .attr("y", ".31em")
        .attr("text-anchor", "middle")
        .text(d => d.id)

      // Add 'marker-end' attribute to each path
      const svg = d3.select(this.$el.querySelector("svg"))
      svg.selectAll("g").selectAll("path").attr("marker-end", d => {
        // Caption items doesn't have source and target
        if (d.source && d.target &&
          d.source.index === d.target.index) return "url(#end-self)";
        else return "url(#end)";
      });

      // Update caption every time data changes
      this.updateCaption()
      simulation.alpha(1).restart()
    },
    updateForces() {
      const { simulation, forceProperties, width, height, force } = this

		if (forceProperties.center.enabled)
		{      simulation.force("center")
				.x(width * forceProperties.center.x)
				.y(height * forceProperties.center.y)
		}
		
		if (forceProperties.charge.enabled)
		{	
		  simulation.force("charge")
			.strength(forceProperties.charge.strength * force)
			.distanceMin(forceProperties.charge.distanceMin)
			.distanceMax(forceProperties.charge.distanceMax)
		}
		
		if (forceProperties.collide.enabled)
		{      
		  simulation.force("collide")
			.strength(forceProperties.collide.strength * force)
			.radius(forceProperties.collide.radius)
			.iterations(forceProperties.collide.iterations)
		}
		
		if (forceProperties.forceX.enabled)
		{
		  simulation.force("forceX")
		//	.strength(forceProperties.forceX.strength * force)
			.x(width * forceProperties.forceX.x)
		}
		
		if (forceProperties.forceY.enabled)
		{
		  simulation.force("forceY")
			.strength(forceProperties.forceY.strength * force)
			.y(height * forceProperties.forceY.y)
		}
		
		if (forceProperties.link.enabled)
		{
		  simulation.force("link")
			.distance(forceProperties.link.distance)
			.iterations(forceProperties.link.iterations * force)
		}

      // updates ignored until this is run
      // restarts the simulation (important if simulation has already slowed down)
      simulation.alpha(1).restart()
    },
    updateNodeLinkCount() {
      let nodeCount = this.nodes.length;
      let linkCount = this.links.length;

      const highlightedNodes = this.selections.graph.selectAll("circle.highlight");
      const highlightedLinks = this.selections.graph.selectAll("path.highlight");
      if (highlightedNodes.size() > 0 || highlightedLinks.size() > 0) {
        nodeCount = highlightedNodes.size()
        linkCount = highlightedLinks.size()
      }
      this.selections.stats.text('Nodes: ' + nodeCount + ' / Edges: ' + linkCount);
    },
    updateCaption() {
      // WARNING: Some gross math will happen here!
      const lineHeight = 30
      const lineMiddle = (lineHeight / 2)
      const captionXPadding = 28
      const captionYPadding = 5

      const caption = this.selections.caption;
      caption.select('rect')
        .attr('height', (captionYPadding * 2) + lineHeight *
          (this.classes.length + this.linkTypes.length))

      const linkLine = (d) => {
        const source = {
          x: captionXPadding + 13,
          y: captionYPadding + (lineMiddle + 1) + (lineHeight * this.linkTypes.indexOf(d)),
        }
        const target = {
          x: captionXPadding - 10,
        }
        return 'M' + source.x + ',' + source.y + 'H' + target.x
      }

      caption.selectAll('g').remove();
      const linkCaption = caption.append('g');
      linkCaption.selectAll('path')
        .data(this.linkTypes)
        .enter().append('path')
        .attr('d', linkLine)
        .attr('class', (d) => 'link ' + d)

      linkCaption.selectAll('text')
        .data(this.linkTypes)
        .enter().append('text')
        .attr('x', captionXPadding + 20)
        .attr('y', (d) => captionYPadding + (lineMiddle + 5) +
          (lineHeight * this.linkTypes.indexOf(d)))
        .attr('class', 'caption')
        .text((d) => d);

      const classCaption = caption.append('g');
      classCaption.selectAll('circle')
        .data(this.classes)
        .enter().append('circle')
        .attr('r', 10)
        .attr('cx', captionXPadding - 2)
        .attr('cy', (d) => captionYPadding + lineMiddle +
          (lineHeight * (this.linkTypes.length + this.classes.indexOf(d))))
        .attr('class', (d) => d.toLowerCase());

      classCaption.selectAll('text')
        .data(this.classes)
        .enter().append('text')
        .attr('x', captionXPadding + 20)
        .attr('y', (d) => captionYPadding + (lineMiddle + 5) +
          (lineHeight * (this.linkTypes.length + this.classes.indexOf(d))))
        .attr('class', 'caption')
        .text((d) => d);

      const captionWidth = caption.node().getBBox().width;
      const captionHeight = caption.node().getBBox().height;
      const paddingX = 18;
      const paddingY = 12;
      caption
        .attr('transform', 'translate(' +
          (this.width - captionWidth - paddingX) + ', ' +
          (this.height - captionHeight - paddingY) + ')');
    },
    zoomed() {
      const transform = d3.event.transform
      // The trick here is to move the grid in a way that the user doesn't perceive
      // that the axis aren't really moving
      // The actual movement is between 0 and gridSize only for x and y
      const translate = transform.x % (this.gridSize * transform.k) + ',' +
        transform.y % (this.gridSize * transform.k)
      this.selections.grid.attr('transform', 'translate(' +
        translate + ') scale(' + transform.k + ')')
      this.selections.graph.attr('transform', transform)

      // Define some world boundaries based on the graph total size
      // so we don't scroll indefinitely
      const graphBox = this.selections.graph.node().getBBox()
      const margin = 200
      const worldTopLeft = [graphBox.x - margin, graphBox.y - margin]
      const worldBottomRight = [
        graphBox.x + graphBox.width + margin,
        graphBox.y + graphBox.height + margin
      ]
      this.zoom.translateExtent([worldTopLeft, worldBottomRight])
    },
    nodeDragStarted(d) {
      if (!d3.event.active) { this.simulation.alphaTarget(0.3).restart() }
      d.fx = d.x
      d.fy = d.y
    },
    nodeDragged(d) {
      d.fx = d3.event.x
      d.fy = d3.event.y
    },
    nodeDragEnded(d) {
      if (!d3.event.active) { this.simulation.alphaTarget(0.0001) }
    //  d.fx = null
     // d.fy = null
    },   
    isSelectedNode(n) {
      return this.selectedNode.includes(n);
    },
    updateHightlights() {
      const graph = this.selections.graph
      const circle = graph.selectAll("circle")
      const path = graph.selectAll("path")
      const text = graph.selectAll("text")

      const related = []
      const relatedLinks = []
      this.selectedNode.forEach((n)=> related.push(n));

      this.simulation.force('link').links().forEach((link) => {
        if (this.isSelectedNode(link.source) || this.isSelectedNode(link.target)) {
          relatedLinks.push(link)
          if (related.indexOf(link.source) === -1) { related.push(link.source) }
          if (related.indexOf(link.target) === -1) { related.push(link.target) }
        }
      })

      this.removeHighlight();

      if (related.length>0)
      {
        circle.filter((df) => related.indexOf(df) > -1).classed('highlight', true)
        circle.filter((df) => related.indexOf(df) === -1).classed('faded', true)
        
        path.filter((df) => this.isSelectedNode(df.source) || this.isSelectedNode(df.target)).classed('highlight', true)
        path.filter((df) => !this.isSelectedNode(df.source) && !this.isSelectedNode(df.target)).classed('faded', true)

        text.filter((df) => related.indexOf(df) > -1).classed('highlight', true)
        text.filter((df) => related.indexOf(df) === -1).classed('faded', true)
      }
      // This ensures that tick is called so the node count is updated
      this.simulation.alphaTarget(0.0001).restart()
    },

    removeHighlight() {
      const graph = this.selections.graph
      const circle = graph.selectAll("circle")
      const path = graph.selectAll("path")
      const text = graph.selectAll("text")

      circle.classed('faded', false)
      circle.classed('highlight', false)
      path.classed('faded', false)
      path.classed('highlight', false)
      text.classed('faded', false)
      text.classed('highlight', false)     
    },
    nodeClick(d) {

      if (this.selectedNode.some((n) => n === d))
        this.selectedNode = this.selectedNode.filter((n) => n !== d);
      else
        this.selectedNode.push(d);
    },
  },
  watch: {
    data: {
      handler(newData) {
        this.updateData()
      },
      deep: true
    },
    selectedNode: {
      handler(newList) {
        this.updateHightlights()
      }
    },
    force:
    {
      handler(newForce) {
        this.updateForces()
      },
      deep: true
    },
    forceProperties: {
      handler(newForce) {
        this.updateForces()
      },
      deep: true
    }
  }
})

new Vue({
  el: '#app',
  data() {
    return {
      data: null,
      force: true,
    }
  },
  mounted() {
    this.changeData();
  },
  methods: {
    changeData() {
		this.data = CollectorData;
		
      /*d3.json('data.json').then(data => {
        this.data = data
      }).catch(error => {
        console.error('Cannot proceed with simulation, failed to  retrieve data.')
      })*/
    },
    disableForce() {
      this.force = !this.force;
    }
  }
})