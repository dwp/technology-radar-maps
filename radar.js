// radar renderer

function polar_to_cartesian(r,t) {  
  var x = r * Math.cos(t);
  var y = r * Math.sin(t);
  return [x,y];
}

function identity(i) { return i; }

/**
 * Uses d3 to plot the radar
 */
function radar(id, data) {
	var width = data.width || 800, height = data.height || 600;
  var cx = width / 2, cy = height / 2;
  var horizonWidth = 0.95*(width > height ? height : width) / 2;
  var quad_angle = 2 * Math.PI / count_calculate_quadrants();
  var sub_quads = get_sub_quadrant_data();
  var horizon_unit = horizonWidth / data.horizons.length;
  var color_scale = d3.scale.categorytechradar();  

	var svg = d3.select(id).append('svg')
    .attr("width", width)
    .attr("height", height);
  svg.append('marker')
    .attr('orient',"auto")
    .attr('markerWidth', '2')
    .attr('markerHeight', '4')
    .attr('refX', 0.1)
    .attr('refY', 2)
    .append('path').attr('d', 'M0,0 V4 L2,2 Z');

  function process_radar_data(data, currentTime) {
    var currentTime = currentTime || new Date();
    // go through the data  
    var results = [];
    for (var i in data.data) {
      var entry = data.data[i];
      var history = entry.history.filter(function(e) {
        return (e.end == null || (e.end > currentTime && e.start < currentTime));
      })[0];
      
      var quadrant_delta = 0;

      // figure out which quadrant this is
      for (var j = 0, len = sub_quads.length; j < len; j++) {
        if (sub_quads[j] == history.quadrant) {
          quadrant_delta = quad_angle * j; 
        }
      }


      var blip = {
        id: i,
        name: entry.name,
        quadrant: history.quadrant,
        superquad: history.superquad,
        position_angle: history.position_angle,
        position: history.position,
        stage: history.stage,
        quad_delta: quadrant_delta,
        status: history.status,
        count: 1
      };

      
      results.push(blip);
    }
    return results;
  }

  function add_horizons(base) {
    var horizons = base
      .append('g')
      .attr('class', 'horizons')
    horizons.selectAll('.horizon')
      .data(data.horizons, identity)
      .enter()
      .append('circle')
      .attr('r', function(d,i) { return (i + 1) * horizon_unit; } )
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('class', 'horizon')
      .attr('stroke-opacity', 1)
      .attr('stroke', function(d,i) { if (i==2 || i==1) return d3.rgb(0,0,0); } )
  }

  function count_calculate_quadrants() {

    var count = 0;
      for (var quadrant in data.sub_quadrants) {
        count = count + data.sub_quadrants[quadrant].length;

      }
      return count;
  }

  function get_sub_quadrant_data() {
    var data2 = [];
      for (var quadrant in data.sub_quadrants) {

          for (var sub_quadrant in data.sub_quadrants[quadrant]) {
            data2.push(data.sub_quadrants[quadrant][sub_quadrant]);
          }
      }
      return data2;
  }

  function add_quadrants(base) {
    // add the quadrants
    var sub_quadrants = get_sub_quadrant_data();
    var quadrants = base
      .append('g')
      .attr('class', 'quadrants')
    function quadrant_class(d) {
      return 'quadrant quadarant-' + d.name.toLowerCase().replace(/ /, '-');
    }

    quadrants.selectAll('line.quadrant')
      .data(sub_quadrants, identity)
      .enter().append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', function(d,i) {
        return (Math.cos(quad_angle * i) * horizonWidth/7*6);
      })
      .attr('y2',  function(d,i) {
        return (Math.sin(quad_angle * i) * horizonWidth/7*6);
      })
      //.attr('class', quadrant_class)
      .attr('stroke', function(d,i) {
        return d3.rgb(0,0,0);
      })
      .attr('stroke-dasharray', ("3", "3"));
    
    arc_function = d3.svg.arc()
      .outerRadius(function(d,i) {
        return d.outerRadius * horizonWidth;
      })
      .innerRadius(function(d,i) {
        return d.innerRadius * horizonWidth;
      })
      .startAngle(function(d,i) {
        return d.quadrant * quad_angle + Math.PI/2;
      })
      .endAngle(function(d,i) {
        return (d.quadrant + 1) * quad_angle + Math.PI/2;
      });
    
    var quads = []
    for (var i = 0, ilen = sub_quadrants.length; i < ilen; i++) {
      for (var j = 0, jlen = data.horizons.length; j < jlen; j++) {
        quads.push({
          outerRadius: (j + 1) / jlen,
          innerRadius: j / jlen,
          quadrant: i, 
          horizon: j, 
          name: sub_quadrants[i]
        });
      }
    }
    var text_angle = (360 / sub_quadrants.length);

    quadrants.selectAll('text.quadrant')
      .data(quads.filter(function(d) { return d.horizon == 0; }))
      .enter()
      .append('text')
      .attr('class','quadrant wrapping')
      .attr('dy', function(d) { if (d.quadrant * text_angle < 180) return horizonWidth / 7 * 6 - 30; else return 0-horizonWidth / 7 * 6 + 30; } )
      .attr('text-anchor', 'middle')
      .attr('transform', function(d) { if (d.quadrant * text_angle < 180) 
        return 'rotate(' + (-90 + d.quadrant * text_angle + (text_angle/2) )+ ')' ; 
        else return 'rotate(' + (90 + d.quadrant * text_angle + (text_angle/2) )+ ')'; } )


      .text(function(d) { return d.name; })

//Main Quadrant
    quadrants.selectAll('line.quadrant')
      .data(data.quadrants, identity)
      .enter().append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('stroke-width', '2px')
      .attr('x2', function(d,i) {

        var ctr = 0;
        var subquads = 0;

        for (var sq in data.sub_quadrants)
        {
          if(sq != d)
          {
            subquads = subquads + data.sub_quadrants[sq].length;

          }else { break;}
        }
        
        subquads = subquads + data.sub_quadrants[d].length;

        return (Math.cos(quad_angle * subquads) * horizonWidth);
      })
      .attr('y2',  function(d,i) {
        var ctr = 0;
        var subquads = 0;

        for (var sq in data.sub_quadrants)
        {
          if(sq != d)
          {
            subquads = subquads + data.sub_quadrants[sq].length;

          }else { break;}
        }
        
        subquads = subquads + data.sub_quadrants[d].length;
        return (Math.sin(quad_angle * subquads) * horizonWidth);
      })
      //.attr('class', quadrant_class)
      .attr('stroke', function(d,i) {
        return d3.rgb(0,0,0);
      });


    quadrants.selectAll('text.quadrant')
      .data(data.quadrants, identity)
      .enter().append('text')
      .attr('class','quadrant big')
      .attr('text-anchor', 'middle')
      .attr('transform', function(d) { 

        var ctr = 0;
        var prev_subquads = 0;

        for (var sq in data.sub_quadrants)
        {
          if(sq != d)
          {
            prev_subquads = prev_subquads + data.sub_quadrants[sq].length;

          }else { break;}
        }
        
        if (prev_subquads * text_angle < 180) return 'rotate(' + (-90 + (prev_subquads * text_angle) + (data.sub_quadrants[d].length * text_angle/2) )+ ')';
        else return 'rotate(' + (90 + (prev_subquads * text_angle) + (data.sub_quadrants[d].length * text_angle/2) )+ ')';
      })

      .attr('dy', function(d) { 

        var ctr = 0;
        var prev_subquads = 0;

        for (var sq in data.sub_quadrants)
        {
          if(sq != d)
          {
            prev_subquads = prev_subquads + data.sub_quadrants[sq].length;

          }else { break;}
        }
        
        if (prev_subquads * text_angle < 180) return horizonWidth - 40; else return 0-horizonWidth + 50;
      })

      .text(function(d) { return d; })


    quadrants.selectAll('path.quadrant') 
      .data(quads)
      .enter()
      .append('path')
      .attr('d', arc_function)
      .attr('fill', function(d,i) { 
       // var rgb = d3.rgb(color_scale(d.quadrant)); console.log(rgb);
        //return rgb.brighter(d.horizon/data.horizons.length * 3);
        return d3.rgb(color_scale(i));
      })
      .attr('class', quadrant_class);
  }

  function draw_radar() {
    // add the horizons
    var base = svg.append('g')
      .attr('transform', "translate(" + cx + "," + cy + ")");
    
    add_horizons(base);
    add_quadrants(base);
    
    var blip_data = process_radar_data(data);
    blip_data.sort(
      function (a,b) {
        if (a.superquad < b.superquad)
          return -1;
        if (a.superquad > b.superquad)
          return 1;
        if (a.quadrant < b.quadrant)
          return -1;
        if (a.quadrant > b.quadrant)
          return 1;
        if (a.name < b.name)
          return -1;
        if (a.name > b.name)
          return 1;
        return 0;
      });

        

    var blips = base.selectAll('.blip')
      .data(blip_data)
      .enter().append('g')
      .attr('class', 'blip')
      .attr('id', function(d) { return 'blip-' + d.id; })
      .attr('transform', function(d) { 
        
        var temparea = "";
        var l = blip_data.length;
        var ctr = 0;
        var currentctr = 0;

            for (i = 0; i < l; i++) { 
              if (blip_data[i].quadrant == d.quadrant && blip_data[i].stage == d.stage)
              ctr += blip_data[i].count;
          }
            for (i = 0; i < l; i++) { 
              if (blip_data[i].quadrant == d.quadrant && blip_data[i].stage == d.stage)
              currentctr += blip_data[i].count;
            if (blip_data[i].name == d.name) { break; }
          }

var coordinates = [[0.5,0.07],
                  [0.3,0.7,0.042,0.098],
                  [0.25,0.5,0.75,0.035,0.105,0.07],
                  [0.2,0.4,0.6,0.8,0.035,0.105,0.035,0.105],
                  [0.25,0.75,0.5,0.25,0.75,0.035,0.035,0.07,0.105,0.105],
                  [0.3,0.5,0.7,0.4,0.6,0.8,0.035,0.035,0.035,0.105,0.105,0.105],
                  [0.25,0.5,0.75,0.25,0.5,0.5,0.75,0.035,0.035,0.07,0.07,0.105,0.105,0.105],
                  [0.1706,0.8294,0.5,0.2589,0.7411,0.5,0.1706,0.8294,0.0238,0.0238,0.0362,0.07,0.07,0.1037,0.1161,0.1161],
                  [0.25,0.5,0.75,0.25,0.5,0.75,0.25,0.5,0.75,0.035,0.035,0.035,0.07,0.07,0.07,0.105,0.105,0.105],
                  [0.4446,0.7409,0.1483,0.5553,0.8517,0.1483,0.3674,0.8517,0.1483,0.5865,0.0207,0.0207,0.0218,0.0592,0.0592,0.0635,0.0913,0.1007,0.1192,0.1192],
                  [0.25,0.5,0.75,0.33,0.66,0.25,0.5,0.75,0.33,0.66,0.25,0.028,0.028,0.028,0.056,0.056,0.084,0.084,0.084,0.112,0.112]
                  ];


          position_angle = coordinates[ctr -1][currentctr-1];

      var stages = [0,0.14,0.29,0.43,0.57];    
      
          position = coordinates[ctr -1][ctr+currentctr-1] + stages[d.stage-1];

      var theta = (position_angle * quad_angle) + d.quad_delta;
      var r = position * horizonWidth;
      var cart = polar_to_cartesian(r, theta)

        return "translate(" + (cart[0]) + "," + (cart[1]) + ")"; })
      .on('mouseover', function(d){
        d3.select(this).select("text.name").style({opacity:'1.0'});
        d3.select(this).select("circle").style({fill:'white'});
      })
      .on('mouseout', function(d){
        d3.select(this).select("text.name").style({opacity:'0.1'});
        d3.select(this).select("circle").style({fill:'black'});
        if (d.status == '1') return d3.select(this).select("circle").style({fill:'grey'})
      })
    
      
    blips.append('circle')
    .attr('r', '4px')
    .attr('fill', function(d) { if (d.status == '1') return "grey"; if (d.status == null) return "black"; if (d.status == '0') return "black"; })
    ;
    
    blips.append("text")
        .attr("dy", "20px")
        .style("text-anchor", "middle")
        .attr('class', 'name')
        .text(function(d) { return d.name; });

    // add the lists
    var table = d3.select(id).append('table');
    table.selectAll('tr')
      .data(blip_data)
      .enter()
      
      .append('tr')
      .html(function(d) { 
        var cellcolour = ["#D62728","#FF7F0E","#2CA02C","#E377C2","#1F77B4"];
        return "<td>" + d.superquad + "</td><td>" + d.quadrant + "</td><td bgcolor=" + cellcolour[d.stage - 1] + " style='opacity:0.5'>" + d.name + d.stage + "</td>"; });

    
  }  
  draw_radar();
}