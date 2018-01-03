[Hilo](https://hiloteam.github.io/)
==========

Site of Hilo

## 编写教程

* 编写教程
    * 所有教程源文件都必须在 `tutorail_src` 目录下。
    * 教程格式为`Markdown`。
    * 编辑`tutorial.yml`文件`pages`块的内容，增加所写的教程文档。
* 编译教程
    * 安装Python的包管理工具`pip`：
        * curl -O https://bootstrap.pypa.io/get-pip.py
        * [sudo] python get-pip.py
    * 运行`[sudo] pip install -r mkdocs/requirements.txt` 安装mkdocs依赖。
    * 运行 `npm run build`。
    * 若编译正确，编译后的教程文档可在 `tutorial` 里找到。