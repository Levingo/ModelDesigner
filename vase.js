function splineTool(group,dragObjects,clickObjects) {
    this.clickObjects=clickObjects
    this.dragObjects=dragObjects
    this.group=group
    this.geometry = new THREE.Geometry();
    this.segments =32 // only to show the line
    this.maxNodes=12
    this.ballPositions = [new THREE.Vector3(0,0,0),new THREE.Vector3(100,100,100),new THREE.Vector3(0,0,0),new THREE.Vector3(100,100,100),new THREE.Vector3(0,0,0)]
    this.curve = new THREE.CatmullRomCurve3( this.ballPositions );
    this.curve.type = 'centripetal';
    this.curve.mesh = new THREE.Line( this.geometry, new THREE.LineBasicMaterial( {color: 0x444444,opacity: 0.85,linewidth:8} ))

    this.clickObjects.push(this.curve.mesh)
    this.curve.mesh.that=this

    this.curve.mesh.clicked=function(point) {
        var newBall=this.that.newBall()
        if (!(newBall)) return null
        newBall.visible=true
        newBall.material=this.that.ballMaterialHover
        newBall.position.set(point.x,point.y,point.z)
        this.that.updateBallPositions()
        return newBall
    }

    this.balls=[]
    this.ballgeometry = new THREE.SphereGeometry( 3,12,12)
    this.ballMaterialNormal=new THREE.MeshPhongMaterial({color: 0xAAAAAA, specular: 0x111111, shininess: 20,side: THREE.DoubleSide, vertexColors: THREE.VertexColors} );
    this.ballMaterialHover=new THREE.MeshPhongMaterial({color: 0x990000, specular: 0x111111, shininess: 20,side: THREE.DoubleSide, vertexColors: THREE.VertexColors} );

    this.changeSegments = function(segments) {
        this.segments=segments
        while (this.curve.mesh.geometry.vertices.length<segments+1) { this.curve.mesh.geometry.vertices.push(new THREE.Vector3());}
        while (this.curve.mesh.geometry.vertices.length>segments+1) { this.curve.mesh.geometry.vertices.pop();}
    }

    this.init = function() {
        this.changeSegments(32)

        for(var i=0;i<this.maxNodes;i++) {

            var ball= new THREE.Mesh(this.ballgeometry , this.ballMaterialNormal);
            ball.position.set(20+ i *10 +i %2*5 - Math.floor(i / 3) *30, 0, i*30 );
            ball.visible=(i<5)
            ball.that=this
            this.balls.push(ball)
            this.group.add(ball);
            this.dragObjects.push(ball)

            ball.planeVector=new THREE.Vector3(0,1,0)
            ball.planePoint=new THREE.Vector3(0,0,0)

            ball.rightclick = function() {
                this.visible=false
                this.that.updateBallPositions()
            }

            ball.hover = function() {
                this.material=this.that.ballMaterialHover
                console.log(this.that.ballPositions)

            }
            ball.normal = function() {
                this.material=this.that.ballMaterialNormal
            }

        }
        this.updateBallPositions()
        this.group.add(this.curve.mesh)
    }

    this.updateBallPositions = function() {
        count=0
        for(var i=0;i<this.maxNodes;i++) {
            if (this.balls[i].visible) count++
        }
        while(this.ballPositions.length>count) this.ballPositions.pop()
        while(this.ballPositions.length<count) this.ballPositions.push(new THREE.Vector3)
        this.balls.sort(function(a, b){ if (a.position.z>b.position.z) {return 1;} else return -1 });
        count=0
        for(var i=0;i<this.maxNodes;i++) {
            if (this.balls[i].visible) {
                this.ballPositions[count]=this.balls[i].position
                count++
            }
        }
       // this.ballPositions.sort(function(a, b){ if (a[2]>b[2]) {return 1;} else return -1 });
    }

    this.newBall = function() {
        for(var i=0;i<this.maxNodes;i++) {
            if (!(this.balls[i].visible)) return this.balls[i]
        }
        return null
    }


    this.updateCurve = function ()  {
        this.ballPositions[0].z=0
        for ( var i = 0; i <= this.segments; i++ ) {
            p = this.curve.mesh.geometry.vertices[i];
            p.copy( this.curve.getPoint( i /  this.segments) );
        }
        this.curve.mesh.geometry.verticesNeedUpdate = true;
    }

}

function VASE(group) {
    this.group=group


    this.filename = 'example';

    this.sides = 72;
    this.division=1;
    this.layers=72;
    this.showgrid=true
    this.that=this
    this.geometry = new THREE.Geometry();
    this.material = new THREE.MeshPhongMaterial({color: 0x555555, specular: 0x111122, shininess: 40,
                                        side: THREE.DoubleSide, vertexColors: THREE.VertexColors} );

    this.mesh = new THREE.Mesh(this.geometry,this.material)
    this.colors=[new THREE.Color(0.3,0.85,0.85),new THREE.Color(0.3,0.9,0.9)]
    group.add(this.mesh)

    this.dragObjects=[]
    this.clickObjects=[]

    this.spline=new splineTool(this.group,this.dragObjects,this.clickObjects)
    this.spline.init()

    this.calculateVertices = function() {
        return this.sides*this.division*(this.layers+1)
    }

    this.calculateFaces = function() {
        return this.sides*this.division*this.layers*2+2*(this.sides*this.division-2)
    }

    this.resizeArrays = function() {
        f=this.calculateFaces()
        v=this.calculateVertices()
        while (this.geometry.vertices.length<v) { this.geometry.vertices.push(new THREE.Vector3());}
        while (this.geometry.vertices.length>v) {this.geometry.vertices.pop();}
        while (this.geometry.faces.length<f) { this.geometry.faces.push(new THREE.Face3());}
        while (this.geometry.faces.length>f) { this.geometry.faces.pop();}

        for(var i=0;i<f;i++) {
            while(this.geometry.faces[i].vertexColors.length<3) {
                this.geometry.faces[i].vertexColors.push(this.colors[i%2].clone())
            }
        }
    }

    this.recolor = function() {
        if (this.showgrid){ var k=2} else {var k=1}
        for(var i=0;i<this.geometry.faces.length;i++) {
            this.geometry.faces[i].vertexColors[0]=this.colors[i%2].clone()
            this.geometry.faces[i].vertexColors[1]=this.colors[i%2].clone()
            this.geometry.faces[i].vertexColors[2]=this.colors[i%2].clone()
            this.geometry.colorsNeedUpdate =true
            this.geometry.elementsNeedUpdate=true
        }
    }
    this.buildFlats = function() {
        var layerdiv=this.sides*this.division
        var va=new THREE.Vector3()
        var vb=new THREE.Vector3()
        var vcross=new THREE.Vector3()
        var a,b,c
        var faceindex=layerdiv*this.layers*2
        //top
        var vertexfirst=this.layers*layerdiv
        var vertices=[]
        for(var i=0;i<layerdiv;i++) {
            vertices.push(vertexfirst+i)
        }
        var vertexindex=0
        while (vertices.length>2) {
            a=vertices[vertexindex % vertices.length]
            b=vertices[(vertexindex+1) % vertices.length]
            c=vertices[(vertexindex+2) % vertices.length]
            va.copy(this.geometry.vertices[b]).sub(this.geometry.vertices[a])
            vb.copy(this.geometry.vertices[c]).sub(this.geometry.vertices[b])
            vcross.copy(va).cross(vb)
            if (vcross.z>0) {
                var f=this.geometry.faces[faceindex]
                f.a=a
                f.b=b
                f.c=c
                //f.vertexColors.push(this.colors[faceindex %2],  this.colors[faceindex %2],  this.colors[faceindex %2])
                faceindex+=1
                vertices.splice((vertexindex+1) % vertices.length,1)
                //if (faceindex%==0) vertexindex=(vertexindex+1)% vertices.length
            }
            else vertexindex=(vertexindex+1)% vertices.length
        }
        //botttom
        var vertexfirst=0
        var vertices=[]
        for(var i=0;i<layerdiv;i++) {
            vertices.push(vertexfirst+i)
        }
        var vertexindex=0
        while (vertices.length>2) {
            a=vertices[vertexindex % vertices.length]
            b=vertices[(vertexindex+1) % vertices.length]
            c=vertices[(vertexindex+2) % vertices.length]
            va.copy(this.geometry.vertices[b]).sub(this.geometry.vertices[a])
            vb.copy(this.geometry.vertices[c]).sub(this.geometry.vertices[b])
            vcross.copy(va).cross(vb)
            if (vcross.z>0) {
                var f=this.geometry.faces[faceindex]
                f.a=c
                f.b=b
                f.c=a
                //f.vertexColors.push(this.colors[faceindex %2],  this.colors[faceindex %2],  this.colors[faceindex %2])
                faceindex+=1
                vertices.splice((vertexindex+1) % vertices.length,1)
            }
            else vertexindex=(vertexindex+1)% vertices.length
        }
    }

    this.build = function() {
        var PI2=Math.PI*2.0,ax,ay,az,radius
        var m=0.0
        var layerdiv=this.sides*this.division
        var p=PI2/(layerdiv)
        var st=0.5
        for (var layer = 0; layer <= this.layers; layer += 1 )   {
            for ( var i = 0.0; i < layerdiv; i++)   {
                m=(i*p)-st*p
                radius=30
                ax = (radius)*Math.cos(m)
                ay = (radius)*Math.sin(m)
                az =  layer /  this.layers*100
                this.geometry.vertices[layer*layerdiv+i].set(ax,ay,az)   // only the first time ... need it to build the faces

            }

        }

        for (var layer = 0; layer < this.layers; layer += 1 )   {
            for ( var i = 0; i < layerdiv; i++)   {
                f=this.geometry.faces[(layer*layerdiv+i)*2]
                g=this.geometry.faces[(layer*layerdiv+i)*2+1]
                f.a=layer*layerdiv+(i % layerdiv)
                f.b=layer*layerdiv+((i+1) % layerdiv)
                f.c=(layer+1)*layerdiv+((i+1) % layerdiv)
                g.a=layer*layerdiv+(i % layerdiv)
                g.b=(layer+1)*layerdiv+((i+1) % layerdiv)
                g.c=(layer+1)*layerdiv+(i % layerdiv)
                //f.vertexColors.push( this.colors[0],this.colors[0],this.colors[0])
                //g.vertexColors.push( this.colors[1],this.colors[1],this.colors[1])
            }
        }
    }

    this.somethingMoved = function() {
        this.spline.updateCurve()
        this.recolor()
        var PI2=Math.PI*2.0,ax,ay,az,radius
        var m=0.0
        var layerdiv=this.sides*this.division
        var p=PI2/(layerdiv)
        var st=0.0
        for (var layer = 0; layer <= this.layers; layer += 1 )   {

            for ( var i = 0; i < layerdiv; i++)   {
                m=(i-st)*p
                radius=this.spline.curve.getPoint( layer /  this.layers).x-5
                ax = radius*Math.cos(m)
                ay = radius*Math.sin(m)
                az = this.spline.curve.getPoint( layer /  this.layers).z
                this.geometry.vertices[layer*layerdiv+i].set(ax,ay,az)
            }
            st+=0.5
        }
        this.geometry.computeFaceNormals();
        //this.geometry.colorsNeedUpdate =true
        this.geometry.verticesNeedUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    this.init = function() {
        this.resizeArrays()
        this.build()
        this.buildFlats()
        //this.geometry.colorsNeedUpdate =true
        this.geometry.elementsNeedUpdate=true
        this.spline.updateCurve()
        this.somethingMoved()

    }



}
