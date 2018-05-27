using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Drawing;
using System.Drawing.Imaging;

using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace RayTracing
{
    class GLGraphics
    {
        Vector3 cameraPosition = new Vector3(0, 0, 1.5f);
        Vector3 cameraDirection = new Vector3(0, 0, 0);
        Vector3 cameraUp = new Vector3(0, 0, 1);

        public float latitude = 47.98f;
        public float longitude = 40.41f;
        public float radius = 5.385f;

        private float rotateAngle = 0;

        public List<int> textureIDs = new List<int>();

        public int BasicProgramID { get; private set; }
        int BasicVertexShader;
        int BasicFragmentShader;

        int vaoHandle;
        //int[] vboHandlers = new int[2];
        int vboHandler;

        private bool ChangeDCP = false;
        Vector3 dcampos = new Vector3(0.0f, 0.0f, 0.001f);

        Vector3[] vertdata = {
            new Vector3(-1.0f, -1.0f, 0.0f),
            new Vector3(1.0f, -1.0f, 0.0f),
            new Vector3(1.0f, 1.0f, 0.0f),
            new Vector3(-1.0f, 1.0f, 0.0f)
            };

    Vector3 campos = new Vector3(0.0f, 0.0f, 1.5f);

        float aspect;
        int camLocation, aspectLocation;

    public void Init(int width, int height) {
            aspect = width / (float)height;
            InitShaders();
            InitVBO();
        }

        public void Resize(int width, int height) {
            GL.ClearColor(Color.DarkGray);
            GL.ShadeModel(ShadingModel.Smooth);
            GL.Enable(EnableCap.DepthTest);

            Matrix4 perspectiveMat = Matrix4.CreatePerspectiveFieldOfView
                (
                    MathHelper.PiOver4,
                    width / (float)height,
                    1,
                    64
                );
            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadMatrix(ref perspectiveMat);
            //SetupLighting();
        }

        public void Update() {
            rotateAngle += 0.1f;

            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);

            cameraPosition = new Vector3(
                (float)(radius * Math.Cos(Math.PI / 180.0f * latitude) * Math.Cos(Math.PI / 180.0f * longitude)),
                (float)(radius * Math.Cos(Math.PI / 180.0f * latitude) * Math.Sin(Math.PI / 180.0f * longitude)),
                (float)(radius * Math.Sin(Math.PI / 180.0f * latitude))
                );

            Matrix4 viewMat = Matrix4.LookAt(cameraPosition, cameraDirection, cameraUp);
            GL.MatrixMode(MatrixMode.Modelview);
            GL.LoadMatrix(ref viewMat);

            if ((campos.Z >= 1.5f) && !ChangeDCP ){
                dcampos = -dcampos;
                ChangeDCP = true;
            }

            if ((campos.Z <= 0.5f) && ChangeDCP) {
                dcampos = -dcampos;
                ChangeDCP = false;
            }

            campos += dcampos;

            Render();
        }

        private void drawTestQuad() {
            GL.Begin(PrimitiveType.Quads);
            GL.Color3(Color.Blue);
            GL.Vertex3(-1.0f, -1.0f, -1.0f);
            GL.Color3(Color.Red);
            GL.Vertex3(-1.0f, 1.0f, -1.0f);
            GL.Color3(Color.White);
            GL.Vertex3(1.0f, 1.0f, -1.0f);
            GL.Color3(Color.Green);
            GL.Vertex3(1.0f, -1.0f, -1.0f);
            GL.End();
        }

        private void drawTexturedQuad()
        {
            GL.Enable(EnableCap.Texture2D);
            GL.BindTexture(TextureTarget.Texture2D, textureIDs[0]);
            GL.Begin(PrimitiveType.Quads);
            GL.Color3(Color.Blue);
            GL.TexCoord2(0.0, 0.0);
            GL.Vertex3(-1.0f, -1.0f, -1.0f);
            GL.Color3(Color.Red);
            GL.TexCoord2(0.0, 1.0);
            GL.Vertex3(-1.0f, 1.0f, -1.0f);
            GL.Color3(Color.White);
            GL.TexCoord2(1.0, 1.0);
            GL.Vertex3(1.0f, 1.0f, -1.0f);
            GL.Color3(Color.Green);
            GL.TexCoord2(1.0, 0.0);
            GL.Vertex3(1.0f, -1.0f, -1.0f);
            GL.End();
            GL.Disable(EnableCap.Texture2D);
        }

        public void Render() {
            //drawTestureQuad();

            //GL.PushMatrix();
            //GL.Translate(1, 1, 1);
            //GL.Rotate(rotateAngle, Vector3.UnitZ);
            //GL.Scale(0.5f, 0.5f, 0.5f);
            //drawTexturedQuad();
            //GL.PopMatrix();

            //GL.Color3(Color.BlueViolet);
            //DrawSphere(1.0f, 30, 30);

            //GL.EnableClientState(ArrayCap.VertexArray);
            //GL.EnableClientState(ArrayCap.ColorArray);

            //GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandlers[0]);
            //GL.VertexPointer(3, VertexPointerType.Float, 0, IntPtr.Zero);

            GL.UseProgram(BasicProgramID);

            //GL.BindVertexArray(vaoHandle);

            GL.Uniform1(aspectLocation, aspect);
            GL.Uniform3(camLocation, campos);

            //GL.EnableVertexAttribArray(0);
            GL.DrawArrays(PrimitiveType.Polygon, 0, 4);
            //GL.DisableVertexAttribArray(0);
            //GL.UseProgram(0);

            //GL.DisableClientState(ArrayCap.VertexArray);
            //GL.DisableClientState(ArrayCap.ColorArray);

        }

        public int LoadTexture(String filePath) {
            try
            {
                Bitmap image = new Bitmap(filePath);
                int texID = GL.GenTexture();
                GL.BindTexture(TextureTarget.Texture2D, texID);
                BitmapData data = image.LockBits(
                    new System.Drawing.Rectangle(0, 0, image.Width, image.Height),
                    ImageLockMode.ReadOnly, System.Drawing.Imaging.PixelFormat.Format32bppArgb
                    );
                GL.TexImage2D(
                    TextureTarget.Texture2D, 0, PixelInternalFormat.Rgba,
                    data.Width, data.Height, 0,
                    OpenTK.Graphics.OpenGL.PixelFormat.Bgra, PixelType.UnsignedByte, data.Scan0
                    );
                image.UnlockBits(data);
                GL.GenerateMipmap(GenerateMipmapTarget.Texture2D);
                return texID;
            }
            catch (System.IO.FileNotFoundException e) {
                return -1;
            }
        }

        private void SetupLighting() {
            GL.Enable(EnableCap.Lighting);
            GL.Enable(EnableCap.Light0);
            GL.Enable(EnableCap.ColorMaterial);

            Vector4 lightPosition = new Vector4(1.0f, 1.0f, 4.0f, 0.0f);
            GL.Light(LightName.Light0, LightParameter.Position, lightPosition);

            Vector4 ambientColor = new Vector4(0.2f, 0.2f, 0.2f, 1.0f);
            GL.Light(LightName.Light0, LightParameter.Ambient, ambientColor);

            Vector4 diffuseColor = new Vector4(0.6f, 0.6f, 0.6f, 1.0f);
            GL.Light(LightName.Light0, LightParameter.Diffuse, diffuseColor);

            Vector4 materialSpecular = new Vector4(1.0f, 1.0f, 1.0f, 1.0f);
            GL.Material(MaterialFace.Front, MaterialParameter.Specular, materialSpecular);
            float materialShininess = 100;
            GL.Material(MaterialFace.Front, MaterialParameter.Shininess, materialShininess);
        }

        private void DrawSphere(double r, int nx, int ny)
        {
            int ix, iy;
            double x, y, z;

            for (iy = 0; iy < ny; ++iy)
            {
                GL.Begin(PrimitiveType.QuadStrip);
                for (ix = 0; ix <= nx; ++ix)
                {
                    x = r * Math.Sin(iy * Math.PI / ny) * Math.Cos(2 * ix * Math.PI / nx);
                    y = r * Math.Sin(iy * Math.PI / ny) * Math.Sin(2 * ix * Math.PI / nx);
                    z = r * Math.Cos(iy * Math.PI / ny);

                    GL.Normal3(x, y, z);
                    GL.Vertex3(x, y, z);

                    x = r * Math.Sin((iy + 1) * Math.PI / ny) * Math.Cos(2 * ix * Math.PI / nx);
                    y = r * Math.Sin((iy + 1) * Math.PI / ny) * Math.Sin(2 * ix * Math.PI / nx);
                    z = r * Math.Cos((iy + 1) * Math.PI / ny);

                    GL.Normal3(x, y, z);
                    GL.Vertex3(x, y, z);

                }
                GL.End();
            }
        }

        void loadShader(String filename, ShaderType type, int program, out int adress) {
            adress = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new System.IO.StreamReader(filename)) {
                string str;
                str = sr.ReadToEnd();
                //Console.WriteLine(str);
                GL.ShaderSource(adress, str);
            }            

            GL.CompileShader(adress);
            GL.AttachShader(program, adress);

            string error = GL.GetShaderInfoLog(adress);
            Console.WriteLine(error);
        }

        private void InitShaders() {

            BasicProgramID = GL.CreateProgram();
            loadShader(
                @"../../Resources/Shaders/vert.vert", ShaderType.VertexShader, BasicProgramID,
                out BasicVertexShader
                );
            loadShader(
                @"../../Resources/Shaders/frag.frag", ShaderType.FragmentShader, BasicProgramID,
                out BasicFragmentShader
                );
            GL.LinkProgram(BasicProgramID);

            GL.DetachShader(BasicProgramID, BasicVertexShader);
            GL.DetachShader(BasicProgramID, BasicFragmentShader);

            GL.DeleteShader(BasicVertexShader);
            GL.DeleteShader(BasicFragmentShader);

            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);

            string log = GL.GetProgramInfoLog(BasicProgramID);
            Console.WriteLine(log);
        }

        private void InitVBO() {
            /*
            //float[] positionData = { -0.8f, -0.8f, 0.0f, 0.8f, -0.8f, 0.0f, 0.0f, 0.8f, 0.0f };
            //float[] colorData = { 1.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 1.0f };

            //GL.GenBuffers(2, vboHandlers);

            //GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandlers[0]);
            //GL.BufferData(BufferTarget.ArrayBuffer,
            //    (IntPtr)(sizeof(float) * positionData.Length),
            //    positionData, BufferUsageHint.StaticDraw);
            //GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandlers[1]);
            //GL.BufferData(BufferTarget.ArrayBuffer,
            //    (IntPtr)(sizeof(float) * colorData.Length),
            //    colorData, BufferUsageHint.StaticDraw);

            //vaoHandle = GL.GenVertexArray();
            //GL.BindVertexArray(vaoHandle);

            //GL.EnableVertexAttribArray(0);
            //GL.EnableVertexAttribArray(1);

            //GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandlers[0]);
            //GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float,
            //    false, 0, 0);


            //GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandlers[1]);
            //GL.VertexAttribPointer(1, 3, VertexAttribPointerType.Float,
            //    false, 0, 0);
            */

            GL.GenBuffers(1, out vboHandler);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandler);
            GL.BufferData(BufferTarget.ArrayBuffer,
                (IntPtr)(sizeof(float) * 3 * vertdata.Length),
                vertdata, BufferUsageHint.StaticDraw);

            vaoHandle = GL.GenVertexArray();
            GL.BindVertexArray(vaoHandle);

            GL.EnableVertexAttribArray(0);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vboHandler);
            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 0, 0);

            //GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
            //GL.BindVertexArray(0);

            camLocation = GL.GetUniformLocation(BasicProgramID, "campos");
            aspectLocation = GL.GetUniformLocation(BasicProgramID, "aspect");

            //GL.UseProgram(BasicProgramID);
        }
    }
}
