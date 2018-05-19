using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using OpenTK;
using OpenTK.Graphics.OpenGL;
using System.IO;

namespace RayTracing
{
    public partial class Form1 : Form
    {
        GLGraphics GLGraphics = new GLGraphics();

        public Form1()
        {
            InitializeComponent();
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            glslVersion.Text = GL.GetString(StringName.ShadingLanguageVersion);
            glVersion.Text = GL.GetString(StringName.Version);

            GLGraphics.Resize(glControl1.Width, glControl1.Height);
            Application.Idle += Application_Idle;

            int texID = GLGraphics.LoadTexture("logo.png");
            GLGraphics.textureIDs.Add(texID);

            GLGraphics.Init(glControl1.Width, glControl1.Height);
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            GLGraphics.Update();
            glControl1.SwapBuffers();
            //GL.UseProgram(0);
        }

        private void glControl1_MouseMove(object sender, MouseEventArgs e)
        {
            float widthCoef = (e.X - glControl1.Width * 0.5f) / (float)glControl1.Width;
            float heightCoef = (-e.Y + glControl1.Height * 0.5f) / (float)glControl1.Height;

            GLGraphics.latitude = heightCoef * 180;
            GLGraphics.longitude = widthCoef * 360;

            glControl1.Invalidate();
        }

        void Application_Idle(Object sender, EventArgs e) {
            while (glControl1.IsIdle)
                glControl1.Refresh();
        }
    }
}
