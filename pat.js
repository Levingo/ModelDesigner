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
            if (i==4) ball.position.set(40, 0, 110 );
            ball.visible=(i<5)&&(i!=1)
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

function surface(group) {
    this.group=group
    this.filename = 'example';

    this.showgrid=true
    this.geometry = new THREE.Geometry();
    this.material = new THREE.MeshPhongMaterial({color: 0x226688, specular: 0x001122, shininess: 40}) //     side: THREE.DoubleSide,

    materials = [this.material,new THREE.MeshBasicMaterial( { transparent: true, opacity: 0 } ) ];

    this.mesh = new THREE.Mesh(this.geometry,new THREE.MeshFaceMaterial( materials ) )
    this.colors=[new THREE.Color(0,0.4,0.75),new THREE.Color(0,0.38,0.75)]
    group.add(this.mesh)

    this.dragObjects=[]
    this.clickObjects=[]
    this.spline=new splineTool(this.group,this.dragObjects,this.clickObjects)
    this.spline.init()

    this.patX=9
    this.patY=3
    this.patYs=3
    this.thickness=4
    this.width=10


    this.maxZ=200

    this.str2xyz=function(s,t,r) {
        var z=t*this.maxZ;
        var umin=0
        var umax=1
        var u
        for(var i=0;i<10;i++) {
            u=(umin+umax)*0.5
            if (this.spline.curve.getPoint(u).z<z) {
                umin=u
            }
            else {
                umax=u
            }
        }
        u=(umin+umax)*0.5
        var tang=this.spline.curve.getTangent(u)
        if (z<10) {
            tang.z=tang.z*z/10+1*(1-z/10)
            tang.x=tang.x*z/10
        }
        var rad=this.spline.curve.getPoint(u).x-5+this.thickness*(r-0.5)*tang.z
        z=z-this.thickness*(r-0.5)*tang.x
        var theta=s*Math.PI*2
        var x=rad*Math.cos(theta)
        var y=rad*Math.sin(theta)
        return [x,y,z]
    }

    this.build = function() {
        for(var ox=0;ox<12*120;ox+=120) {
            for(var oy=0;oy<12*120;oy+=120) {
                //var bot=false
                //if (oy==0) bot=true
                pat1(this.geometry,ox,oy,1,1)//,bot)
                pat1(this.geometry,ox+60,oy,-1,1)//,bot)

                //bot=false
                //if (oy==240) bot=true
                pat1(this.geometry,ox,oy+60,1,-1)//,bot)
                pat1(this.geometry,ox+60,oy+60,-1,-1)//,bot)

            }
            pat1a(this.geometry,ox,-60,-1,1)//,bot)
            pat1a(this.geometry,ox+60,-60,1,1)//,bot)

            for(var oy=-120;oy>-60*8;oy-=60) {
                pat1b(this.geometry,ox,oy,1,1)//,bot)
                pat1b(this.geometry,ox+60,oy,1,1)//,bot)
            }
        }
    }

    this.transform = function(upd) {
        for(var i=0;i<this.geometry.vertices.length;i++) {
            if ((this.geometry.vertices[i].ox<this.patX*2)&&(this.geometry.vertices[i].oy<this.patY*2)&&(this.geometry.vertices[i].oy>=-1-this.patYs*1)) {
                s=(this.geometry.vertices[i].xx)/(this.patX*120)
                t=(this.geometry.vertices[i].yy+60+this.patYs*60)/(this.patY*120+60+this.patYs*60+10)
                r=this.geometry.vertices[i].zz/2

                xyz=this.str2xyz(s,t,r)
                this.geometry.vertices[i].x=xyz[0]
                this.geometry.vertices[i].y=xyz[1]
                this.geometry.vertices[i].z=xyz[2]
            }

            else {
                this.geometry.vertices[i].x=this.geometry.vertices[i].xx
                this.geometry.vertices[i].y=this.geometry.vertices[i].yy
                this.geometry.vertices[i].z=this.geometry.vertices[i].zz
            }
        }

        if (upd==true) {
            for(var i=0;i<this.geometry.faces.length;i++) {
                if ((this.geometry.faces[i].ox<this.patX*2)&&(this.geometry.faces[i].oy<this.patY*2)&&(this.geometry.faces[i].oy>=-1-this.patYs*1)) {
                    this.geometry.faces[i].materialIndex=0
                }
                else {
                    this.geometry.faces[i].materialIndex=1
                }
            }

        this.geometry.elementsNeedUpdate = true;
        this.geometry.computeFaceNormals();
        }

        //this.geometry.sortFacesByMaterialIndex();
        this.geometry.verticesNeedUpdate = true;


        //this.geometry.colorsNeedUpdate =true;
        //this.geometry.computeBoundingSphere();
        //this.geometry.buffersNeedUpdate = true;
        //this.geometry.uvsNeedUpdate = true;
    }

    this.somethingMoved = function() {
        this.spline.updateCurve()
        this.maxZ=this.spline.curve.getPoint(1).z
        this.transform(false)
    }

    this.init = function() {
        this.build()
        this.somethingMoved()
        this.transform(true)
        //this.geometry.colorsNeedUpdate =true


    }

}

function pat1(geometry,offsetx,offsety,mirrorx,mirrory) {
    this.geometry=geometry;
    this.vo=this.geometry.vertices.length
    this.fo=this.geometry.faces.length
    this.sizex=60;
    this.sizey=60;

    this.addFace1=function(a,b,c,plus) {
        f=new THREE.Face3( c+this.vo, b+this.vo, a+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+plus+this.vo, b+plus+this.vo, c+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

    }

    this.addFace2=function(a,b,plus) {
        f=new THREE.Face3( a+this.vo, b+this.vo, b+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+this.vo, b+plus+this.vo, a+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);
    }

    this.add4Faces=function(a,b,c,d,e,plus) {

        this.addFace1(b,c,a,plus,0,0)
        this.addFace1(a,c,d,plus,0,0)
        this.addFace1(e,a,d,plus,0,0)
        this.addFace1(b,a,e,plus,0,0)
    }


        for(var zz=-1;zz<=1;zz+=2) {
            var z=zz*mirrorx*mirrory
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety-30*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 30*mirrorx, 30+offsety-30*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 10*mirrorx, 30+offsety-20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety-20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 30*mirrorx, 30+offsety-20*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 0*mirrorx, 30+offsety-10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 10*mirrorx, 30+offsety-10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety-10*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx- 10*mirrorx, 30+offsety+0*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 0*mirrorx, 30+offsety+0*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 10*mirrorx, 30+offsety+0*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx -20*mirrorx, 30+offsety+10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx -10*mirrorx, 30+offsety+10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 0*mirrorx, 30+offsety+10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 10*mirrorx, 30+offsety+10*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety+10*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx -30*mirrorx, 30+offsety+20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx- 20*mirrorx, 30+offsety+20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx- 10*mirrorx, 30+offsety+20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 10*mirrorx, 30+offsety+20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety+20*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 30*mirrorx, 30+offsety+20*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx- 30*mirrorx, 30+offsety+30*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx- 20*mirrorx, 30+offsety+30*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 20*mirrorx, 30+offsety+30*mirrory, z ));
            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 30*mirrorx, 30+offsety+30*mirrory, z ));

            this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ 30*mirrorx, 30+offsety-40*mirrory, z ));
        }

        for(var i=vo;i<this.geometry.vertices.length;i++) {
            this.geometry.vertices[i].xx=this.geometry.vertices[i].x
            this.geometry.vertices[i].yy=this.geometry.vertices[i].y
            this.geometry.vertices[i].zz=this.geometry.vertices[i].z
            this.geometry.vertices[i].ox=offsetx/60
            this.geometry.vertices[i].oy=offsety/60
        }

        var plus=27
        this.addFace1(0,1,4,plus);
        this.add4Faces(3,0,4,7,2,plus);
        this.add4Faces(6,2,7,10,5,plus);
        this.add4Faces(9,5,10,13,8,plus);
        this.add4Faces(12,8,13,18,11,plus);
        this.add4Faces(14,10,15,19,13,plus);
        this.add4Faces(17,11,18,23,16,plus);
        this.add4Faces(20,15,21,24,19,plus);
        this.addFace1(16,23,22,plus);
        this.addFace1(21,25,24,plus);

        this.addFace2(2,0,plus);
        this.addFace2(5,2,plus);
        this.addFace2(8,5,plus);
        this.addFace2(11,8,plus);
        this.addFace2(16,11,plus);
        this.addFace2(4,7,plus);
        this.addFace2(7,10,plus);
        this.addFace2(10,15,plus);
        this.addFace2(15,21,plus);
        this.addFace2(24,19,plus);
        this.addFace2(19,13,plus);
        this.addFace2(13,18,plus);
        this.addFace2(18,23,plus);

        //if (bottom==true) {
            this.addFace2(0,26,plus);
            this.addFace1(26,1,0,plus);
        //}

        for(var i=fo;i<this.geometry.faces.length;i++) {
            this.geometry.faces[i].ox=offsetx/60
            this.geometry.faces[i].oy=offsety/60
        }
}


function pat1a(geometry,offsetx,offsety,mirrorx,mirrory) {
    this.geometry=geometry;
    this.vo=this.geometry.vertices.length
    this.fo=this.geometry.faces.length
    this.sizex=60;
    this.sizey=60;

    this.addFace1=function(a,b,c,plus) {
        f=new THREE.Face3( c+this.vo, b+this.vo, a+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+plus+this.vo, b+plus+this.vo, c+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

    }

    this.addFace2=function(a,b,plus) {
        f=new THREE.Face3( a+this.vo, b+this.vo, b+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+this.vo, b+plus+this.vo, a+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);
    }

    this.add4Faces=function(a,b,c,d,e,plus) {

        this.addFace1(b,c,a,plus,0,0)
        this.addFace1(a,c,d,plus,0,0)
        this.addFace1(e,a,d,plus,0,0)
        this.addFace1(b,a,e,plus,0,0)
    }


        for(var zz=-1;zz<=1;zz+=2) {
            var z=zz*mirrorx*mirrory
            for(var bb=-30;bb<=30;bb+=10) {
                for(var aa=-30;aa<=30;aa+=10) {

                    this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ aa*mirrorx, 30+offsety+bb*mirrory, z ));
                }
            }
        }

        for(var i=vo;i<this.geometry.vertices.length;i++) {
            this.geometry.vertices[i].xx=this.geometry.vertices[i].x
            this.geometry.vertices[i].yy=this.geometry.vertices[i].y
            this.geometry.vertices[i].zz=this.geometry.vertices[i].z
            this.geometry.vertices[i].ox=offsetx/60
            this.geometry.vertices[i].oy=offsety/60
        }

        var plus=49
        for(bb=0;bb<6;bb++) {
            for(aa=0;aa<6-bb;aa++) {
                this.addFace1(0+aa+7*bb,1+aa+7*bb,7+aa+7*bb,plus);
                this.addFace1(1+aa+7*bb,8+aa+7*bb,7+aa+7*bb,plus);
            }
            this.addFace2(bb,bb+1,plus);

        }
        for(aa=0;aa<5;aa++) {
            this.addFace1(12+6*aa,13+6*aa,12+7+6*aa,plus);
            this.addFace2(13+6*aa,12+7+6*aa,plus);

        }

        //if (bottom==true) {
        this.addFace2(43,42,plus);
            //this.addFace1(26,1,0,plus);
        //}

        for(var i=fo;i<this.geometry.faces.length;i++) {
            this.geometry.faces[i].ox=offsetx/60
            this.geometry.faces[i].oy=offsety/60
        }
}


function pat1b(geometry,offsetx,offsety,mirrorx,mirrory) {
    this.geometry=geometry;
    this.vo=this.geometry.vertices.length
    this.fo=this.geometry.faces.length
    this.sizex=60;
    this.sizey=60;

    this.addFace1=function(a,b,c,plus) {
        f=new THREE.Face3( c+this.vo, b+this.vo, a+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+plus+this.vo, b+plus+this.vo, c+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

    }

    this.addFace2=function(a,b,plus) {
        f=new THREE.Face3( a+this.vo, b+this.vo, b+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);

        f=new THREE.Face3( a+this.vo, b+plus+this.vo, a+plus+this.vo )
        //f.vertexColors.push(this.colors[0],this.colors[0],this.colors[0])
        this.geometry.faces.push(f);
    }

    this.add4Faces=function(a,b,c,d,e,plus) {

        this.addFace1(b,c,a,plus,0,0)
        this.addFace1(a,c,d,plus,0,0)
        this.addFace1(e,a,d,plus,0,0)
        this.addFace1(b,a,e,plus,0,0)
    }


        for(var zz=-1;zz<=1;zz+=2) {
            var z=zz*mirrorx*mirrory
            for(var bb=-30;bb<=30;bb+=10) {
                for(var aa=-30;aa<=30;aa+=10) {

                    this.geometry.vertices.push(new THREE.Vector3(30+offsetx+ aa*mirrorx, 30+offsety+bb*mirrory, z ));
                }
            }
        }

        for(var i=vo;i<this.geometry.vertices.length;i++) {
            this.geometry.vertices[i].xx=this.geometry.vertices[i].x
            this.geometry.vertices[i].yy=this.geometry.vertices[i].y
            this.geometry.vertices[i].zz=this.geometry.vertices[i].z
            this.geometry.vertices[i].ox=offsetx/60
            this.geometry.vertices[i].oy=offsety/60
        }

        var plus=49
        for(bb=0;bb<6;bb++) {
            for(aa=0;aa<6;aa++) {
                this.addFace1(0+aa+7*bb,1+aa+7*bb,7+aa+7*bb,plus);
                this.addFace1(1+aa+7*bb,8+aa+7*bb,7+aa+7*bb,plus);
            }
           this.addFace2(bb,bb+1,plus);
           this.addFace2(48-bb,48-bb-1,plus);
        }


        for(var i=fo;i<this.geometry.faces.length;i++) {
            this.geometry.faces[i].ox=offsetx/60
            this.geometry.faces[i].oy=offsety/60
        }
}
